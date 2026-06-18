// Transitive JSON import inside a plugin — mirrors the reported repro where a
// plugin reads config data from a local JSON file (#4807).
import pluginData from './plugin-data.json';

export class MyPlugin {
    static pluginName = pluginData.name;
}
