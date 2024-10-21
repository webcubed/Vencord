import { Devs } from "@utils/constants";
import definePlugin, { PluginNative }  from "@utils/types";
import { findByCode, findByCodeLazy } from "@webpack";
import { Flex } from "@components/Flex";
import { Button, FluxDispatcher, Alerts, Forms, UserStore, Toasts } from "@webpack/common";
import { UserProfileStore } from "@webpack/common";
import { DataStore } from "@api/index";
const native = VencordNative.pluginHelpers.Identity as PluginNative<typeof import("./native")>;

const CustomizationSection = findByCodeLazy(".customizationSectionBackground");

async function SetNewData()
{
    let PersonData = JSON.parse(await native.RequestRandomUser());
    console.log(PersonData);

    let pfpBase64 = JSON.parse(await native.ToBase64ImageUrl({imgUrl: PersonData.picture.large})).data;

    //holy moly
    FluxDispatcher.dispatch({type: "USER_SETTINGS_ACCOUNT_SET_PENDING_AVATAR", avatar: pfpBase64});
    FluxDispatcher.dispatch({type: "USER_SETTINGS_ACCOUNT_SET_PENDING_GLOBAL_NAME", globalName: `${PersonData.name.first} ${PersonData.name.last}`});
    FluxDispatcher.dispatch({type: "USER_SETTINGS_ACCOUNT_SET_PENDING_PRONOUNS", pronouns: ""})
    FluxDispatcher.dispatch({type: "USER_SETTINGS_ACCOUNT_SET_PENDING_BANNER", banner: null})
    FluxDispatcher.dispatch({type: "USER_SETTINGS_ACCOUNT_SET_PENDING_ACCENT_COLOR", color: null})
    FluxDispatcher.dispatch({type: "USER_SETTINGS_ACCOUNT_SET_PENDING_THEME_COLORS", themeColors: [null, null]})
    FluxDispatcher.dispatch({type: "USER_SETTINGS_ACCOUNT_SET_PENDING_BIO", bio: `Hello! I am ${PersonData.name.first} ${PersonData.name.last}`})
}

async function SaveData()
{
    let userData = UserProfileStore.getUserProfile(UserStore.getCurrentUser().id);

    //the getUserProfile function doesn't return all the information we need, so we append the standard user object data to the end
    let extraUserObject : any = { extraUserObject: UserStore.getCurrentUser()};

    let pfp = JSON.parse(await native.ToBase64ImageUrl({imgUrl: `https://cdn.discordapp.com/avatars/${userData.userId}/${extraUserObject.extraUserObject.avatar}.webp?size=4096`})).data;
    let banner = JSON.parse(await native.ToBase64ImageUrl({imgUrl: `https://cdn.discordapp.com/banners/${userData.userId}/${userData.banner}.webp?size=4096`})).data;

    let fetchedBase64Data = 
    {
        pfpBase64: pfp,
        bannerBase64: banner
    };

    DataStore.set("identity-saved-base", JSON.stringify({...userData, ...extraUserObject, ...{fetchedBase64Data: fetchedBase64Data}}));
}

async function LoadData()
{
    let userDataMaybeNull = await DataStore.get("identity-saved-base");
    if(!userDataMaybeNull)
    {
        Toasts.show({message: "No saved base! Save one first.", id: Toasts.genId(), type: Toasts.Type.FAILURE});
        return;
    }

    let userData = JSON.parse(userDataMaybeNull);
    
    console.log(userData);

    let { pfpBase64, bannerBase64} = userData.fetchedBase64Data;

    FluxDispatcher.dispatch({type: "USER_SETTINGS_ACCOUNT_SET_PENDING_AVATAR", avatar: pfpBase64});
    FluxDispatcher.dispatch({type: "USER_SETTINGS_ACCOUNT_SET_PENDING_GLOBAL_NAME", globalName: userData.extraUserObject.globalName});
    FluxDispatcher.dispatch({type: "USER_SETTINGS_ACCOUNT_SET_PENDING_PRONOUNS", pronouns: userData.pronouns})
    FluxDispatcher.dispatch({type: "USER_SETTINGS_ACCOUNT_SET_PENDING_BANNER", banner: bannerBase64})
    FluxDispatcher.dispatch({type: "USER_SETTINGS_ACCOUNT_SET_PENDING_ACCENT_COLOR", color: userData.accentColor})
    FluxDispatcher.dispatch({type: "USER_SETTINGS_ACCOUNT_SET_PENDING_THEME_COLORS", themeColors: userData.themeColors})
    FluxDispatcher.dispatch({type: "USER_SETTINGS_ACCOUNT_SET_PENDING_BIO", bio: userData.bio})
}

function ResetCard()
{
    return(
        <CustomizationSection
            title={"Identity"}
            hasBackground={true}
            hideDivider={false}
        >
            <Flex>
                <Button
                    onClick={() => 
                        {
                            Alerts.show({
                                title: "Hold on!",
                                body: <div>
                                    <Forms.FormText>
                                        Saving your base profile will allow you to have a backup of your actual profile
                                    </Forms.FormText>
                                    <Forms.FormText type={Forms.FormText.Types.DESCRIPTION}>
                                        If you save, it will overwrite your previous data.
                                    </Forms.FormText>
                                </div>,
                                confirmText: "Save Anyway",
                                cancelText: "Cancel",
                                onConfirm: SaveData
                            });
                        }}
                    size={Button.Sizes.MEDIUM}
                >
                    Save Base
                </Button>
                <Button
                    onClick={() => 
                        {
                            Alerts.show({
                                title: "Hold on!",
                                body: <div>
                                    <Forms.FormText>
                                        Loading your base profile will restore your actual profile settings
                                    </Forms.FormText>
                                    <Forms.FormText type={Forms.FormText.Types.DESCRIPTION}>
                                        If you load, it will overwrite your current profile configuration.
                                    </Forms.FormText>
                                </div>,
                                confirmText: "Load Anyway",
                                cancelText: "Cancel",
                                onConfirm: LoadData
                            });
                        }}
                    size={Button.Sizes.MEDIUM}
                >
                    Load Base
                </Button>
                <Button
                    onClick={SetNewData}
                    size={Button.Sizes.MEDIUM}
                >
                    Randomise
                </Button>
            </Flex>
        </CustomizationSection>
    )
}

export default definePlugin({
    name: "Identity",
    description: "Allows you to edit your profile to a random fake person with the click of a button",
    authors:
    [
        Devs.Samwich
    ],
    ResetCard: ResetCard,
    patches: [
        {
            find: "DefaultCustomizationSections",
            replacement: {
                match: /(?<=USER_SETTINGS_AVATAR_DECORATION},"decoration"\),)/,
                replace: "$self.ResetCard(),"
            }
        },
    ]
});
