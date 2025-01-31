import { useImmerStore } from "@/composables/immerStore";
import type {
  Scenario,
  ScenarioEvent,
  ScenarioInfo,
  Side,
  SideGroup,
  Unit,
} from "@/types/scenarioModels";
import dayjs from "dayjs";
import { nanoid } from "@/utils";
import { walkSide } from "@/stores/scenarioStore";
import { klona } from "klona";
import type { EntityId } from "@/types/base";
import type {
  NScenarioFeature,
  NScenarioLayer,
  NSide,
  NSideGroup,
  NUnit,
} from "@/types/internalModels";
import { useScenarioTime } from "./time";
import type { FeatureId, VisibilityInfo } from "@/types/scenarioGeoModels";

export interface ScenarioState {
  id: EntityId;
  unitMap: Record<EntityId, NUnit>;
  sideMap: Record<EntityId, NSide>;
  sideGroupMap: Record<EntityId, NSideGroup>;
  sides: EntityId[];
  layers: FeatureId[];
  layerMap: Record<FeatureId, NScenarioLayer>;
  featureMap: Record<FeatureId, NScenarioFeature>;
  info: ScenarioInfo;
  events: ScenarioEvent[];
  mergedEvents: ScenarioEvent[];
  currentTime: number;
  getUnitById: (id: EntityId) => NUnit;
  getSideById: (id: EntityId) => NSide;
  getSideGroupById: (id: EntityId) => NSideGroup;
}

export type NewScenarioStore = ReturnType<typeof useNewScenarioStore>;

function prepareScenario(scenario: Scenario): ScenarioState {
  const unitMap: Record<EntityId, NUnit> = {};
  const sideMap: Record<EntityId, NSide> = {};
  const sideGroupMap: Record<EntityId, NSideGroup> = {};
  const sides: EntityId[] = [];
  const layers: FeatureId[] = [];
  const layerMap: Record<FeatureId, NScenarioLayer> = {};
  const featureMap: Record<FeatureId, NScenarioFeature> = {};
  const events = [...scenario.events].map((e) => ({
    ...e,
    startTime: +dayjs(e.startTime),
  }));

  const mergedEvents: ScenarioEvent[] = [...events];

  if (scenario.startTime !== undefined) {
    scenario.startTime = +dayjs(scenario.startTime);
  }

  function prepareUnit(
    unit1: Unit,
    level: number,
    parent: Unit | SideGroup,
    sideGroup: SideGroup,
    side: Side
  ) {
    const unit = klona(unit1);
    if (!unit.state) {
      unit.state = [];
    } else {
      unit.state = unit.state.map((e) => ({
        ...e,
        t: +dayjs(e.t),
        id: e.id || nanoid(),
      }));
    }
    unit.state
      .filter((s) => s.title)
      .forEach((s) => {
        const { t: startTime, subTitle, description } = s;
        mergedEvents.push({
          startTime,
          title: s.title || "NN",
          subTitle,
          description,
        });
      });
    unit._state = null;
    if (!unit.id) {
      unit.id = nanoid();
    }

    unit._pid = parent.id;
    unit._isOpen = false;
    unit._gid = sideGroup.id;
    unit._sid = side.id;

    unitMap[unit1.id] = {
      ...unit,
      subUnits: unit.subUnits?.map((u) => u.id) || [],
    } as NUnit;
  }

  scenario.sides.forEach((side) => {
    sideMap[side.id] = { ...side, groups: side.groups.map((group) => group.id) };
    sides.push(side.id);
    side.groups.forEach((group) => {
      sideGroupMap[group.id] = {
        ...group,
        _pid: side.id,
        subUnits: group.subUnits.map((unit) => unit.id),
      };
    });
    walkSide(side, prepareUnit);
  });

  const info: ScenarioInfo = {
    name: scenario.name,
    startTime: scenario.startTime,
    timeZone: scenario.timeZone,
    description: scenario.description,
    symbologyStandard: scenario.symbologyStandard,
  };

  function mapVisibility<T extends Partial<VisibilityInfo>>(l: T): T {
    const r = { ...l };
    if (l.visibleFromT !== undefined) {
      r.visibleFromT = +dayjs(l.visibleFromT);
    }
    if (l.visibleUntilT !== undefined) {
      r.visibleUntilT = +dayjs(l.visibleUntilT);
    }
    return r;
  }

  scenario.layers.forEach((layer) => {
    layers.push(layer.id);
    layerMap[layer.id] = {
      ...mapVisibility(layer),
      features: layer.features.map((f) => f.id),
    };
    layer.features.forEach((feature) => {
      const tmp = { ...feature };
      tmp.properties = mapVisibility(tmp.properties);
      featureMap[feature.id] = { ...tmp, _pid: layer.id };
    });
  });

  mergedEvents.sort(({ startTime: a }, { startTime: b }) => (a < b ? -1 : a > b ? 1 : 0));

  return {
    layers,
    layerMap,
    featureMap,
    id: nanoid(),
    currentTime: scenario.startTime || 0,
    info,
    sides,
    unitMap,
    sideMap,
    sideGroupMap,
    events,
    mergedEvents,
    getUnitById(id: EntityId) {
      return this.unitMap[id];
    },
    getSideById(id: EntityId) {
      return this.sideMap[id];
    },
    getSideGroupById(id: EntityId) {
      return this.sideGroupMap[id];
    },
  };
}

export type ActionLabel =
  | "deleteLayer"
  | "addLayer"
  | "addFeature"
  | "deleteFeature"
  | "addUnitPosition"
  | "updateFeature"
  | "updateFeatureGeometry"
  | "addSide"
  | "updateLayer"
  | "moveLayer"
  | "moveFeature"
  | "batchLayer";

export function useNewScenarioStore(data: Scenario) {
  const inputState = prepareScenario(data);
  const store = useImmerStore<ScenarioState, ActionLabel>(inputState);
  useScenarioTime(store).setCurrentTime(store.state.currentTime);
  return store;
}
