/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin, { StartAt } from "@utils/types";
import { filters, moduleListeners, waitFor } from "@webpack";

const SYM_FORWARD_REF = Symbol.for("react.forward_ref");
const SYM_MEMO = Symbol.for("react.memo");
/**
 * Calls {@link setComponentName} on the given component
 * @returns maybeComponent
 */
function wrapComponentName<T>(maybeComponent: T, name?: string): T {
    // Don't set if name is falsy
    if (name) setComponentName(maybeComponent, name);
    return maybeComponent;
}
function setComponentName(maybeComponent: any, name: string): void {
    function defineComponentName(propName: "name" | "displayName") {
        if (Object.hasOwn(maybeComponent, propName)) {
            const desc = Object.getOwnPropertyDescriptor(maybeComponent, propName);
            if (desc?.configurable) {
                Object.defineProperty(maybeComponent, propName, {
                    configurable: desc.configurable,
                    writable: desc.writable ?? true,
                    value: name
                });
            }
        } else {
            Object.defineProperty(maybeComponent, propName, {
                configurable: true,
                value: name
            });
        }
    }
    try {
        if (
            typeof maybeComponent === "function" &&
            "toString" in maybeComponent &&
            typeof maybeComponent.toString === "function"
        ) {
            const str: string = (() => { }).toString.call(maybeComponent);
            if (typeof str !== "string") void 0;
            else if (str.startsWith("class")) {
                defineComponentName("displayName");
            } else {
                // Because typeof v === "function" and v is not a class
                // v must be a function or an arrow function
                defineComponentName("name");
            }
        } else if (
            "$$typeof" in maybeComponent &&
            typeof maybeComponent.$$typeof === "symbol" &&
            (maybeComponent.$$typeof === SYM_FORWARD_REF || maybeComponent.$$typeof === SYM_MEMO)
        ) {
            defineComponentName("displayName");
        } else {
            throw new Error("Unknown component type, not a function, class, memo or a forwardRef");
        }

    } catch (e) {
        (IS_DEV ? console.warn : console.debug)(e, maybeComponent, name);
    }
}
export default definePlugin({
    name: "ComponentDemangler",
    description: "",
    authors: [Devs.sadan],
    startAt: StartAt.Init,
    patches: [
        {
            find: '"focus-rings-ring"',
            replacement: {
                match: /function (\i).{0,200}"focus-rings-ring"/,
                replace: "$self.setComponentName($1, 'Ring');$&"
            }
        },
        // Add a debug value to useStateFromStores
        {
            find: 'attach("useStateFromStores")',
            replacement: {
                match: /(?=let.{0,200}(\i)\.useRef)/,
                replace: "$1.useRef($self.getStoreNames(arguments[0]));"
            }
        },
        // Radio items, as they're not exported
        {
            find: ".radioIndicatorDisabled",
            replacement: {
                match: /(?=render\(\)\{)/,
                replace: "static displayName=\"RadioItem\";"
            }
        },
        // Tabs in a TabBar
        {
            find: ".tabBarRef",
            replacement: {
                match: /(?=getStyle\(\)\{)/,
                replace: "static displayName=\"Tab\";"
            }
        }
    ],
    setComponentName,
    start() {
        moduleListeners.add(m => {
            if (m == null || typeof m !== "object") return;
            for (const exp in m) {
                if ((filters.componentByCode(".colors.INTERACTIVE_NORMAL,colorClass")(m[exp]))) {
                    setComponentName(m[exp], "Icon");
                }
            }
        });
        // Show up in React's hooks display
        waitFor(filters.byCode("useStateFromStores"), m => {
            setComponentName(m, "useStateFromStores");
        });
        // Use https://www.npmjs.com/package/react-focus-rings to find the components and their names
        waitFor(filters.componentByCode("FocusRing was given a focusTarget"), m => {
            setComponentName(m, "FocusRing");
        });
        waitFor(filters.componentByCode(".current]", "setThemeOptions"), m => {
            setComponentName(m, "FocusRingScope");
        });
        // Discord's context menu is horrifying
        // Use the demangled module to get the finds for each menu item type
        waitFor(filters.componentByCode(".sparkles", "dontCloseOnActionIfHoldingShiftKey"), m => {
            setComponentName(m, "Menu.MenuItem");
        });
        waitFor(filters.componentByCode('role:"separator",', ".separator"), m => {
            setComponentName(m, "Menu.MenuSeparator");
        });
        // For some reason, this is marked as groupend
        waitFor(filters.componentByCode('role:"group"', "contents:"), m => {
            setComponentName(m, "Menu.MenuGroup");
        });
        waitFor(filters.componentByCode(".customItem"), m => {
            setComponentName(m, "Menu.MenuCustomItem");
        });
        waitFor(filters.componentByCode('"MenuCheckboxItem"'), m => {
            setComponentName(m, "Menu.MenuCheckboxItem");
        });
        waitFor(filters.componentByCode('"MenuRadioItem"'), m => {
            setComponentName(m, "Menu.MenuRadioItem");
        });
        waitFor(filters.componentByCode("menuItemProps", "control"), m => {
            setComponentName(m, "Menu.MenuControlItem");
        });
        waitFor(filters.componentByCode("'[tabindex=\"0\"]'"), m => {
            setComponentName(m, "Menu.MenuCompositeControlItem");
        });
        // Checkbox
        waitFor(filters.componentByCode('"span":"label"'), m => {
            setComponentName(m, "Checkbox");
        });
        waitFor(filters.componentByCode("radioItemIconClassName", "withTransparentBackground", "radioBarClassName"), m => {
            setComponentName(m, "RadioGroup");
        });
        waitFor(filters.componentByCode(".onlyShineOnHover"), m => {
            setComponentName(m, "ShinyButton");
        });
        waitFor(filters.componentByCode("subMenuClassName", "renderSubmenu"), m => {
            setComponentName(m, "Menu.MenuSubMenuItem");
        });
    },
    getStoreNames(stores: any[]): string {
        return stores.map(s => s[Symbol.toStringTag]).join(", ");
    }
}
);
