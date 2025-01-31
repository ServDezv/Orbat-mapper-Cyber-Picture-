<template>
  <SimpleModal v-model="open" dialog-title="Import data" @cancel="onCancel">
    <ImportLoadStep
      v-if="importState === 'select'"
      @cancel="onCancel"
      @loaded="onLoaded"
    />
    <ImportMilxStep
      v-else-if="importState === 'milx'"
      @cancel="onCancel"
      :data="loadedData as MilxImportedLayer[]"
      @loaded="onImport"
    />
    <ImportGeojsonStep
      v-else-if="importState === 'geojson'"
      @cancel="onCancel"
      :data="loadedData as FeatureCollection"
      @loaded="onImport"
    />
    <ImportSpatialIllusionsStep
      v-else-if="importState === 'unitgenerator'"
      @cancel="onCancel"
      :data="loadedData as SpatialIllusionsOrbat"
      @loaded="onImport"
    />
    <ImportOrbatGeneratorStep
      v-else-if="importState === 'orbatgenerator'"
      @cancel="onCancel"
      :data="loadedData as OrbatGeneratorOrbat"
      @loaded="onImport"
    />
  </SimpleModal>
</template>

<script setup lang="ts">
import SimpleModal from "./SimpleModal.vue";
import { useNotifications } from "@/composables/notifications";
import { useRouter } from "vue-router";
import { useVModel } from "@vueuse/core";
import ImportLoadStep from "@/components/ImportLoadStep.vue";
import { ref, shallowRef } from "vue";
import ImportMilxStep from "@/components/ImportMilxStep.vue";
import ImportGeojsonStep from "@/components/ImportGeojsonStep.vue";
import ImportSpatialIllusionsStep from "@/components/ImportSpatialIllusionsStep.vue";
import { OrbatGeneratorOrbat, SpatialIllusionsOrbat } from "@/types/externalModels";
import type { FeatureCollection } from "geojson";
import { MilxImportedLayer } from "@/composables/scenarioImport";
import ImportOrbatGeneratorStep from "@/components/ImportOrbatGeneratorStep.vue";

const router = useRouter();

type ImportState = "select" | "milx" | "geojson" | "unitgenerator" | "orbatgenerator";
const importState = ref<ImportState>("select");
const loadedData = shallowRef<any>([]);

const props = withDefaults(defineProps<{ modelValue: boolean }>(), { modelValue: false });
const emit = defineEmits(["update:modelValue", "cancel"]);
const { send } = useNotifications();

const open = useVModel(props, "modelValue", emit);
function onLoaded(nextState: ImportState, data: any) {
  loadedData.value = data;
  importState.value = nextState;
}
function onImport() {
  open.value = false;
  send({ message: "Imported units" });
}

function onCancel() {
  open.value = false;
  emit("cancel");
}
</script>
