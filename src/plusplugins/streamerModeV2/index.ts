/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

let down: ((event: any) => void) | null = null;
let up = null

export default definePlugin({
    name: "streamerModeV2",
    description: "Blurs servers, direct messages, friends and more upon pressing Shift",
    authors: [Devs.HumanCat222],

    start: () => {
        const injectCSS = css => {
            let el = document.createElement('style');
            el.type = 'text/css';
            el.innerText = css;
            return el;
        };

        let css = injectCSS(`.interactive__776ee  {
    filter: blur(9px) brightness(0.4)
}

.interactive__776ee:hover  {
    filter: blur(0px) brightness(1)
}

.itemCard__1f162 {
    filter: blur(9px) brightness(0.9)
}

.itemCard__1f162:hover {
    filter: blur(0px) brightness(1)
}

.interactiveSelected_ec846b {
    filter: blur(0px) brightness(1)
}

.wrapper_d281dd {
    filter: blur(9px) brightness(0.4)
}

.friendWrapper__70b6f {
    filter: blur(9px) brightness(0.4)
}

.friendWrapper__70b6f:hover {
    filter: blur(0px) brightness(1)
}

.peopleListItem_d14722 {
    filter: blur(9px) brightness(0.4)
}

.peopleListItem_d14722:hover {
    filter: blur(0px) brightness(1)
}

.result__25f11 {
    filter: blur(9px) brightness(0.4)
}

.result__25f11[aria-selected="true"] {
    filter: blur(0px) brightness(1)
}

.selected_f5ec8e {
    filter: blur(0px) brightness(1)
}

.linkButton_ebd2ba {
    filter: blur(0px) brightness(1)
}

[aria-label="Direct Messages"] {
    filter: blur(0px) brightness(1)
}`);

        function toggleStreamerModeV2(enable) {
            if (enable) { 
                document.head.appendChild(css);
            } else {
                document.head.removeChild(css);
            }
        }

        if (down === null) {
            down = function(event) {    
                if (event.key === "Shift") {
                    toggleStreamerModeV2(true)
                }
            }
        }
        
         if (up === null) {
            up = function(event) {    
                if (event.key === "Shift") {
                    setTimeout(function(){toggleStreamerModeV2(false)}, 1000)
                }
            }
        }
        
        document.addEventListener('keydown', down)
        document.addEventListener('keyup', up)
    },
    stop: () => {
        document.removeEventListener('keydown', down)
        document.removeEventListener('keyup', up)
    }
});
