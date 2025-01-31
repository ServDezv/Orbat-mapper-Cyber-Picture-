<template>
  <div class="relative flex min-h-0 flex-auto">
    <ResizablePanel
      class="relative z-10 flex flex-col justify-between border-r-2 bg-gray-100 dark:bg-gray-900"
      v-model:width="panelWidthA"
      @resizeend="geoStore.updateMapSize()"
    >
      <TabView
        v-model:current-tab="activeScenarioTab"
        :key="state.id"
        extra-class="px-6"
        tab-class=""
        class="min-h-0"
      >
        <TabItem label="Units" class="relative">
          <OrbatPanel class="pb-12">
            <template #header
              ><p
                class="pl-6 pr-2 text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Order of battle
              </p></template
            >
          </OrbatPanel>
        </TabItem>
        <TabItem label="Info">
          <ScenarioInfoPanel />
        </TabItem>
        <TabItem label="Layers" v-slot="{ isActive }">
          <keep-alive>
            <ScenarioLayersTab
              v-if="isActive"
              v-model="showLayerPanel"
              :active-layer-id="activeLayerId"
              :active-feature-id="activeFeatureId"
            />
          </keep-alive>
        </TabItem>
        <template #extra>
          <DotsMenu
            :items="scenarioMenuItems"
            class="relative -mr-2 pt-2"
            @action="onScenarioAction"
          />
        </template>
        <TabItem label="Events">
          <ScenarioEventsPanel class="px-6" />
        </TabItem>
      </TabView>
      <footer
        class="flex flex-shrink-0 items-center overflow-auto border-t border-gray-300 bg-gray-200 dark:bg-gray-700"
      >
        <TimeController class="" />
      </footer>
    </ResizablePanel>
    <ResizablePanel
      v-show="showLayerPanel"
      data-teleport-layer
      v-model:width="panelWidthB"
      @resizeend="geoStore.updateMapSize()"
    />
    <ResizablePanel
      v-if="showUnitPanel"
      @resizeend="geoStore.updateMapSize()"
      v-model:width="panelWidthC"
    >
      <TabView
        v-model:current-tab="currentTab"
        extra-class="px-6"
        tab-class="pl-6 pr-6"
        class="min-h-0"
      >
        <TabItem label="Unit details">
          <UnitPanel v-if="activeUnitId" :unit-id="activeUnitId" />
        </TabItem>
        <template #extra>
          <div class="flex pt-4">
            <CloseButton @click="toggleUnitPanel()" />
          </div>
        </template>
      </TabView>
    </ResizablePanel>
    <ScenarioMap class="flex-1" data-teleport-map>
      <ToolPanel v-if="orbatTabActive && geoStore.olMap" />
      <p
        class="pointer-events-none absolute right-4 top-2 text-3xl font-bold text-black"
        style="text-shadow: white 0 0 5px"
      >
        {{ scenarioTime.format("YYYY-MM-DD") }}
      </p>
    </ScenarioMap>
    <KeyboardScenarioActions v-if="geoStore.olMap" />
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onActivated,
  onUnmounted,
  ref,
  watch,
} from "vue";
import OrbatPanel from "@/modules/scenarioeditor/OrbatPanel.vue";
import UnitPanel from "./UnitPanel.vue";
import { useActiveUnitStore } from "@/stores/dragStore";
import TabView from "@/components/TabView.vue";
import TabItem from "@/components/TabItem.vue";
import TimeController from "@/components/TimeController.vue";
import { useRoute, useRouter } from "vue-router";
import { useClipboard, useTitle, useToggle, watchOnce } from "@vueuse/core";
import DotsMenu from "@/components/DotsMenu.vue";
import { ScenarioActions, TAB_LAYERS, TAB_ORBAT } from "@/types/constants";
import { useNotifications } from "@/composables/notifications";
import { useGeoStore } from "@/stores/geoStore";
import CloseButton from "@/components/CloseButton.vue";
import { FeatureId } from "@/types/scenarioGeoModels";
import NProgress from "nprogress";
import { activeScenarioKey, activeUnitKey } from "@/components/injects";
import ScenarioInfoPanel from "./ScenarioInfoPanel.vue";
import ScenarioMap from "@/components/ScenarioMap.vue";
import { MenuItemData } from "@/components/types";
import ScenarioEventsPanel from "@/modules/scenarioeditor/ScenarioEventsPanel.vue";
import KeyboardScenarioActions from "@/modules/scenarioeditor/KeyboardScenarioActions.vue";
import { storeToRefs } from "pinia";
import { injectStrict } from "@/utils";
import { useSearchActions } from "@/composables/search";
import { useTabStore } from "@/stores/tabStore";
import ResizablePanel from "@/components/ResizablePanel.vue";
import ToolPanel from "@/modules/scenarioeditor/ToolPanel.vue";

const ScenarioLayersTab = defineAsyncComponent(() => import("./ScenarioLayersTab.vue"));

const emit = defineEmits(["showExport", "showLoad"]);
const activeUnitId = injectStrict(activeUnitKey);

const uiTabs = useTabStore();
const { activeScenarioTab, orbatTabActive } = storeToRefs(uiTabs);
const activeScenario = injectStrict(activeScenarioKey);
const { state, update } = activeScenario.store;
const {
  unitActions,
  io,
  time: { scenarioTime },
} = activeScenario;
const route = useRoute();
const router = useRouter();

const { onUnitSelect, onFeatureSelect, onLayerSelect } = useSearchActions();
const { copy: copyToClipboard, copied } = useClipboard();
const currentTab = ref(0);
const isOpen = ref(false);

const activeUnitStore = useActiveUnitStore();

const originalTitle = useTitle().value;
const windowTitle = computed(() => state.info.name);
const { send } = useNotifications();
const geoStore = useGeoStore();
const [showUnitPanel, toggleUnitPanel] = useToggle();
const showLayerPanel = ref(false);

const activeLayerId = ref<FeatureId | null>(null);
const activeFeatureId = ref<FeatureId | null>(null);

useTitle(windowTitle);

onUnmounted(() => {
  useTitle(originalTitle);
  activeUnitStore.clearActiveUnit();
});

watch([showUnitPanel, showLayerPanel], (v) => {
  nextTick(() => geoStore.updateMapSize());
});

watch(activeUnitId, (v) => {
  showUnitPanel.value = !!(v && activeScenarioTab.value === TAB_ORBAT);
});

watch(activeScenarioTab, (value, prevValue) => {
  if (value === 1 && prevValue === 0) {
    activeUnitStore.clearActiveUnit();
    showUnitPanel.value = false;
  }
});

onActivated(() => {
  geoStore.updateMapSize();
});

const scenarioMenuItems: MenuItemData<ScenarioActions>[] = [
  { label: "Add new side", action: "addSide" },
  { label: "Save to local storage", action: "save" },
  { label: "Load from local storage", action: "load" },
  { label: "Load scenario", action: "loadNew" },
  { label: "Download as JSON", action: "exportJson" },
  { label: "Copy to clipboard", action: "exportToClipboard" },
  { label: "Export scenario", action: "export" },
  { label: "Import", action: "import" },
];

async function onScenarioAction(action: ScenarioActions) {
  if (action === "addSide") {
    unitActions.addSide();
  } else if (action === "save") {
    io.saveToLocalStorage();
    send({ message: "Scenario saved to local storage" });
  } else if (action === "load") {
    io.loadFromLocalStorage();
    send({ message: "Scenario loaded from local storage" });
  } else if (action === "exportJson") {
    await io.downloadAsJson();
  } else if (action === "loadNew") {
    emit("showLoad");
  } else if (action === "exportToClipboard") {
    await copyToClipboard(io.stringifyScenario());
    if (copied.value) send({ message: "Scenario copied to clipboard" });
  } else if (action === "export") {
    emit("showExport");
  } else {
    send({ message: "Not implemented yet" });
  }
}

onUnitSelect(({ unitId }) => {
  activeScenarioTab.value = TAB_ORBAT;
  activeUnitId.value = unitId;
  const { parents } = unitActions.getUnitHierarchy(unitId);
  parents.forEach((p) => (p._isOpen = true));
  nextTick(() => {
    const el = document.getElementById(`o-${unitId}`);
    if (el) {
      el.scrollIntoView();
    }
  });
});

onLayerSelect(({ layerId }) => {
  activeLayerId.value = layerId;
  activeScenarioTab.value = TAB_LAYERS;
});

onFeatureSelect(({ featureId }) => {
  activeFeatureId.value = featureId;
  activeScenarioTab.value = TAB_LAYERS;
});

watchOnce(
  () => activeScenarioTab.value === TAB_LAYERS,
  () => {
    NProgress.start();
  }
);

const panelWidthA = ref(382);
const panelWidthB = ref(382);
const panelWidthC = ref(382);
</script>
