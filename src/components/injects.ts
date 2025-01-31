import type { InjectionKey, Ref, ShallowRef } from "vue";
import type { EntityId } from "@/types/base";
import { TScenario } from "@/scenariostore";
import { UseFeatureStyles } from "@/geo/featureStyles";
import { SidcModalPromise, TimeModalPromise } from "@/composables/modals";
import { SelectedScenarioFeatures } from "@/stores/dragStore";
import { EventHook } from "@vueuse/core";
import { FeatureId } from "@/types/scenarioGeoModels";
import type OLMap from "ol/Map";
import type Select from "ol/interaction/Select";
export const activeUnitKey = Symbol("Active unit") as InjectionKey<
  Ref<EntityId | undefined | null>
>;
export const activeParentKey = Symbol("Active unit") as InjectionKey<
  Ref<EntityId | undefined | null>
>;

export const selectedUnitIdsKey = Symbol("Selected units") as InjectionKey<
  Ref<Set<EntityId>>
>;
export const selectedFeatureIdsKey = Symbol("Selected features") as InjectionKey<
  Ref<SelectedScenarioFeatures>
>;
export const activeScenarioKey = Symbol("Active scenario") as InjectionKey<TScenario>;
export const activeFeaturesKey = Symbol(
  "Active features"
) as InjectionKey<UseFeatureStyles>;

export const currentScenarioTabKey = Symbol("Current scenario tab") as InjectionKey<
  Ref<number>
>;

export const timeModalKey = Symbol("Time modal") as InjectionKey<{
  getModalTimestamp: TimeModalPromise;
}>;

export const sidcModalKey = Symbol("SIDC modal") as InjectionKey<{
  getModalSidc: SidcModalPromise;
}>;

export const searchActionsKey = Symbol("Search actions") as InjectionKey<{
  onUnitSelectHook: EventHook<{ unitId: EntityId }>;
  onLayerSelectHook: EventHook<{ layerId: FeatureId }>;
  onFeatureSelectHook: EventHook<{ featureId: FeatureId; layerId: FeatureId }>;
}>;

export const activeMapKey = Symbol("Active map") as InjectionKey<ShallowRef<OLMap>>;
export const activeFeatureSelectInteractionKey = Symbol(
  "Active feature select"
) as InjectionKey<ShallowRef<Select>>;
