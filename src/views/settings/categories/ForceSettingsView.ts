import { ForceSettings } from "src/settings/categories/ForceSettings";
import SimpleSliderSetting, {
	DEFAULT_SLIDER_STEP_OPTIONS,
	SliderOptions,
} from "../../atomics/SimpleSliderSetting";
import State from "../../../util/State";

const DisplaySettingsView = (
	forceSettings: State<ForceSettings>,
	containerEl: HTMLElement
) => {
	CenterForceSetting(forceSettings, containerEl);
};

const CenterForceSetting = (
	forceSettings: State<ForceSettings>,
	containerEl: HTMLElement
) => {
	const options: SliderOptions = {
		name: "Center Force",
		value: forceSettings.value.centerStrength,
		stepOptions: DEFAULT_SLIDER_STEP_OPTIONS,
	};
	return SimpleSliderSetting(containerEl, options, (value) => {
        value = (value - 1) / 19;
        var force = 0.0002 * value * value + 0.00001;
		forceSettings.value.centerStrength = force;
	});
};


export default DisplaySettingsView;






// var force = 0.0002 * value * value + 0.00001;