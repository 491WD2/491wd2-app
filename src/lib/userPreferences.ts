import type { FamilyData, MemberPageLayoutSettings } from "../data/familyData";

export const DASHBOARD_PAGE_KEY = "dashboard";

export function getMemberPageLayoutSettings(
  data: FamilyData,
  memberId: string | undefined,
  pageKey: string,
): MemberPageLayoutSettings | undefined {
  if (!memberId) {
    return undefined;
  }
  return data.adminSettings.userPreferencesByMemberId?.[memberId]?.pageSettings?.[
    pageKey
  ];
}

export function upsertMemberPageLayout(
  data: FamilyData,
  memberId: string,
  pageKey: string,
  patch: Partial<MemberPageLayoutSettings>,
): FamilyData {
  const prefsRoot = data.adminSettings.userPreferencesByMemberId ?? {};
  const memberPref = prefsRoot[memberId] ?? {};
  const pages = { ...memberPref.pageSettings };
  const cur = pages[pageKey] ?? {};
  pages[pageKey] = { ...cur, ...patch };
  return {
    ...data,
    adminSettings: {
      ...data.adminSettings,
      userPreferencesByMemberId: {
        ...prefsRoot,
        [memberId]: { ...memberPref, pageSettings: pages },
      },
    },
  };
}
