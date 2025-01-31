<template>
  <RadioGroup v-model="selected">
    <RadioGroupLabel class="sr-only"> Privacy setting</RadioGroupLabel>
    <div class="-space-y-px rounded-md bg-white">
      <RadioGroupOption
        as="template"
        v-for="(setting, settingIdx) in settings"
        :key="setting.title"
        :value="setting"
        v-slot="{ checked, active }"
      >
        <div
          :class="[
            settingIdx === 0 ? 'rounded-tl-md rounded-tr-md' : '',
            settingIdx === settings.length - 1 ? 'rounded-bl-md rounded-br-md' : '',
            checked ? 'z-10 border-indigo-200 bg-indigo-50' : 'border-gray-200',
            'relative flex cursor-pointer border p-4 focus:outline-none',
          ]"
        >
          <span
            class="flex-shrink-0"
            :class="[
              checked ? 'border-transparent bg-indigo-600' : 'border-gray-300 bg-white',
              active ? 'ring-2 ring-indigo-500 ring-offset-2' : '',
              'mt-0.5 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border',
            ]"
            aria-hidden="true"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          <div class="ml-3 flex min-w-0 flex-auto flex-col">
            <RadioGroupLabel
              as="div"
              :class="[
                checked ? 'text-indigo-900' : 'text-gray-900',
                'flex items-center justify-between text-sm font-medium',
              ]"
            >
              <span class="flex-auto truncate">{{ setting.title }}</span>
              <OpacityInput
                :model-value="setting.opacity"
                @update:model-value="$emit('update:layerOpacity', setting, $event)"
                class="flex-shrink-0"
              />
            </RadioGroupLabel>
            <RadioGroupDescription
              as="span"
              :class="[checked ? 'text-indigo-700' : 'text-gray-500', 'block text-sm']"
            >
              {{ setting.description || "" }}
            </RadioGroupDescription>
          </div>
        </div>
      </RadioGroupOption>
    </div>
  </RadioGroup>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import {
  RadioGroup,
  RadioGroupDescription,
  RadioGroupLabel,
  RadioGroupOption,
} from "@headlessui/vue";
import { IconOpacity as OpacityIcon } from "@iconify-prerendered/vue-mdi";
import { LayerInfo } from "./LayersPanel.vue";
import OpacityInput from "./OpacityInput.vue";

export default defineComponent({
  components: {
    OpacityInput,
    RadioGroup,
    RadioGroupDescription,
    RadioGroupLabel,
    RadioGroupOption,
    OpacityIcon,
  },
  props: {
    settings: { type: Array as PropType<LayerInfo<any>[]>, required: true },
    modelValue: { type: Object as PropType<LayerInfo<any>> },
  },
  emits: ["update:modelValue", "update:layerOpacity"],
  // setup(props) {
  //   const selected = ref(props.settings[0]);
  //
  //   return {
  //     selected,
  //   };
  // },
  computed: {
    selected: {
      get(): LayerInfo | undefined {
        return this.modelValue;
      },
      set(v: LayerInfo) {
        this.$emit("update:modelValue", v);
      },
    },
  },
});
</script>
