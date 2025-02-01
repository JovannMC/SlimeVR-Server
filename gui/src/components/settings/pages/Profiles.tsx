import { useLocalization } from '@fluent/react';
import { useState } from 'react';
import { Typography } from '@/components/commons/Typography';
import {
  SettingsPageLayout,
  SettingsPagePaneLayout,
} from '@/components/settings/SettingsPageLayout';
import { WrenchIcon } from '@/components/commons/icon/WrenchIcons';

import { defaultConfig as defaultGUIConfig, useConfig } from '@/hooks/config';
import { defaultValues as defaultDevConfig } from '@/components/widgets/DeveloperModeWidget';

export function Profiles() {
  const { l10n } = useLocalization();
  const { setConfig } = useConfig();

  return (
    <SettingsPageLayout>
      <form className="flex flex-col gap-2 w-full">
        <SettingsPagePaneLayout icon={<WrenchIcon></WrenchIcon>} id="advanced">
          <>
            <Typography variant="main-title">
              {l10n.getString('settings-utils-profiles')}
            </Typography>

            <div className="grid gap-4">
              <div className="sm:grid sm:grid-cols-[1.75fr,_1fr] items-center">
                <div></div>
              </div>
            </div>
          </>
        </SettingsPagePaneLayout>
      </form>
    </SettingsPageLayout>
  );
}
