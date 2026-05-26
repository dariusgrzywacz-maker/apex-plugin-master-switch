# Master Switch for Checkbox Group (Oracle APEX Plugin)

A declarative Oracle APEX Dynamic Action plugin to manage master-child checkbox relationships. It simplifies "Select All" functionality with support for indeterminate states, automatic event propagation, and configurable behavior.

## Key Features 🚀

- **Bidirectional Sync:** Clicking the Master Switch toggles all child checkboxes. Changing individual child checkboxes updates the Master Switch state automatically.
- **Indeterminate State Support:** If only some checkboxes are selected, the Master Switch automatically enters the `indeterminate` state.
- **Declarative Configuration:** No JavaScript coding required – everything is handled via Dynamic Action attributes.
- **Smart Exclusions:** Automatically respects `disabled` states for child checkboxes.
- **Custom Events:** Emits custom JavaScript events, making it easy to hook into other page processes.
- **Event Propagation:** Optionally triggers standard `change` events for child checkboxes.

## Installation 📦

1. Download the latest release from the [Releases page](https://github.com/dariusgrzywacz-maker/apex-plugin-master-switch/releases).
2. In your Oracle APEX Application, go to **Shared Components** > **Plug-ins**.
3. Click **Import** and select the `dynamic_action_plugin_master_switch_da.sql` file.
4. Follow the installation wizard to complete the import.

## How to Use ⚙️

1. Create a **Dynamic Action** on your page (e.g., on `Page Load` or `Region Refresh`).
2. Select **Master Switch for Checkbox Group [Plug-in]** as the action.
3. Configure the following attributes:
   - **Master Selector:** CSS selector for your main switch/checkbox (e.g., `#P10_MASTER_SWITCH`).
   - **Group Selector:** CSS selector for the region/container holding the checkboxes (e.g., `#checkbox_group_container`).
   - **Checkbox Selector:** Target elements (defaults to `input[type="checkbox"]`).
   - **Exclude Disabled:** Enable this to skip disabled checkboxes during mass-selection.
   - **Propagate Change:** Enable if you need child elements to trigger their own `change` events.

## Configuration Parameters

| Attribute | Description |
| :--- | :--- |
| **Master Selector** | jQuery selector for the master switch element. |
| **Group Selector** | jQuery selector for the container of child elements. |
| **Exclude Disabled** | If set to Yes, disabled checkboxes are ignored. |
| **Propagate Change** | If set to Yes, triggers `change` event on children. |
| **Initialize On Load** | Calculates the master state immediately on page load. |

## Compatibility
- Tested on Oracle APEX 26.1+ (should be compatible with older versions supporting standard Dynamic Actions).

## License 📜
This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## Feedback & Contributions
Found a bug or have a feature request? Please open an **Issue** in this repository. Contributions are always welcome!

---
*Created with ❤️ for the Oracle APEX community.*
