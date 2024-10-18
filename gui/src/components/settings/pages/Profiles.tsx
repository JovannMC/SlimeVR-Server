import { useLocalization } from '@fluent/react';
import { useEffect, useMemo, useState } from 'react';
import { Typography } from '@/components/commons/Typography';
import {
  SettingsPageLayout,
  SettingsPagePaneLayout,
} from '@/components/settings/SettingsPageLayout';
import { WrenchIcon } from '@/components/commons/icon/WrenchIcons';
import { Button } from '@/components/commons/Button';

import { error, log } from '@/utils/logging';
import { useConfig } from '@/hooks/config';
import { defaultValues as defaultDevConfig } from '@/components/widgets/DeveloperModeWidget';
import { CreateProfileModal } from '@/components/settings/CreateProfileModal';
import { DeleteProfileModal } from '@/components/settings/DeleteProfileModal';
import { Input } from '@/components/commons/Input';
import { useForm } from 'react-hook-form';
import { Dropdown } from '@/components/commons/Dropdown';

export function ProfileSettings() {
  const { l10n } = useLocalization();
  const { config, getCurrentProfile, getProfiles, setProfile, deleteProfile } =
    useConfig();
  const [profiles, setProfiles] = useState<string[]>([]);
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      const profiles = await getProfiles();
      setProfiles(profiles);
    };
    fetchProfiles();

    const profile = getCurrentProfile();
    setProfileValue('profile', profile);

    const subscription = watchProfileSubmit(() =>
      handleProfileSubmit(onSelectSubmit)()
    );
    return () => subscription.unsubscribe();
  });

  const profileItems = useMemo(() => {
    // Add default profile to dropdown
    const defaultProfile = { label: 'Default profile', value: 'default' };
    const mappedProfiles = profiles.map((profile) => ({
      label: profile,
      value: profile,
    }));

    return [defaultProfile, ...mappedProfiles];
  }, [profiles]);

  // is there a better way to do this, theres a bunch of stuff here lol
  const {
    control: nameControl,
    watch: watchNameSubmit,
    handleSubmit: handleNameSubmit,
  } = useForm<{
    newName: string;
  }>({
    defaultValues: { newName: '' },
  });

  const {
    control: profileControl,
    watch: watchProfileSubmit,
    handleSubmit: handleProfileSubmit,
    setValue: setProfileValue,
  } = useForm<{
    profile: string;
  }>({
    defaultValues: { profile: config?.profile },
  });

  const {
    control: deleteControl,
    handleSubmit: handleDeleteControl,
    watch: watchDeleteControl,
  } = useForm<{
    profile: string;
  }>({
    defaultValues: { profile: config?.profile || 'default' },
  });

  const profileToCreate = watchNameSubmit('newName');
  const onNameSubmit = async (data: { newName: string }) => {
    // TODO: add ui if invalid name, already exists, or 'default'
    if (!data.newName || data.newName === '' || data.newName === 'default')
      return;

    log(`Creating new profile with name ${data.newName}`);
    setShowCreatePrompt(true);
  };

  const onSelectSubmit = (data: { profile: string }) => {
    log(`Switching to profile ${data.profile}`);
    setProfile(data.profile);
  };

  const profileToDelete = watchDeleteControl('profile');
  const onDeleteSelectSubmit = async (data: { profile: string }) => {
    if (data.profile === 'default') {
      error('Cannot delete default profile');
      return;
    }
    log(`Deleting profile ${data.profile}`);
    await deleteProfile(data.profile);

    // Update profiles list
    const profiles = await getProfiles();
    setProfiles(profiles);
  };

  const createProfile = async (name: string, useDefault: boolean) => {
    log(`Creating profile with name ${name} aaaaa`);
    const profiles = await getProfiles();
    log(`Profiles: ${profiles}`);
    if (profiles.includes(name)) {
      error(`Profile with name ${name} already exists`);
      return;
    }

    log(`Creating new profile with name ${name} with defaults: ${useDefault}`);

    if (!useDefault) {
      const currentConfig = config;
      if (!currentConfig)
        throw new Error(
          'cannot copy current settings because.. current config does not exist?'
        );
      await setProfile(name, currentConfig);
    } else {
      // config.ts automatically uses default config if no config is passed
      await setProfile(name);
    }
  };

  return (
    <SettingsPageLayout>
      <SettingsPagePaneLayout icon={<WrenchIcon />} id="profiles">
        <>
          <Typography variant="main-title">
            {l10n.getString('settings-utils-profiles')}
          </Typography>
          <div className="flex flex-col pt-2 pb-4">
            <>
              {l10n
                .getString('settings-utils-profiles-description')
                .split('\n')
                .map((line, i) => (
                  <Typography color="secondary" key={i}>
                    {line}
                  </Typography>
                ))}
            </>
          </div>
          <div>
            <Typography bold>
              {l10n.getString('settings-utils-profiles-profile')}
            </Typography>
            <div className="flex flex-col pt-1 pb-2">
              <Typography color="secondary">
                {l10n.getString('settings-utils-profiles-profile-description')}
              </Typography>
            </div>
            <div className="grid sm:grid-cols-1 pb-4">
              <Dropdown
                control={profileControl}
                name="profile"
                display="block"
                placeholder={l10n.getString('settings-utils-profiles-default')}
                direction="down"
                items={profileItems}
              ></Dropdown>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mobile:grid-cols-1">
            <div>
              <Typography bold>
                {l10n.getString('settings-utils-profiles-new')}
              </Typography>
              <div className="flex flex-col pt-1 pb-2">
                <Typography color="secondary">
                  {l10n.getString('settings-utils-profiles-new-description')}
                </Typography>
              </div>
              <form onSubmit={handleNameSubmit(onNameSubmit)}>
                <div className="flex gap-2 mobile:flex-col">
                  <div style={{ flexBasis: '65%' }}>
                    <Input
                      control={nameControl}
                      rules={{ required: true }}
                      name="newName"
                      type="text"
                      placeholder="Enter name"
                      variant="secondary"
                      className="flex-grow"
                    />
                  </div>

                  <Button
                    variant="secondary"
                    className="flex-grow"
                    style={{ flexBasis: '35%' }}
                    type="submit"
                  >
                    {l10n.getString('settings-utils-profiles-new-label')}
                  </Button>
                </div>
              </form>
              <CreateProfileModal
                primary={() => {
                  setShowCreatePrompt(false);
                  createProfile(profileToCreate, true);
                }}
                secondary={() => {
                  setShowCreatePrompt(false);
                  createProfile(profileToCreate, false);
                }}
                onClose={() => setShowCreatePrompt(false)}
                isOpen={showCreatePrompt}
              ></CreateProfileModal>
            </div>

            <div>
              <Typography bold>
                {l10n.getString('settings-utils-profiles-delete')}
              </Typography>
              <div className="flex flex-col pt-1 pb-2">
                <Typography color="secondary">
                  {l10n.getString('settings-utils-profiles-delete-description')}
                </Typography>
              </div>
              <div className="flex gap-2 mobile:flex-col">
                <div style={{ flexBasis: '65%' }}>
                  <Dropdown
                    control={deleteControl}
                    name="profile"
                    display="block"
                    placeholder={l10n.getString(
                      'settings-utils-profiles-default'
                    )}
                    direction="down"
                    items={profileItems}
                  ></Dropdown>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDeleteWarning(true);
                  }}
                  style={{ flexBasis: '35%' }}
                >
                  {l10n.getString('settings-utils-profiles-delete-label')}
                </Button>
                <DeleteProfileModal
                  accept={() => {
                    handleDeleteControl(onDeleteSelectSubmit)();
                    setShowDeleteWarning(false);
                  }}
                  onClose={() => setShowDeleteWarning(false)}
                  isOpen={showDeleteWarning}
                  profile={profileToDelete}
                ></DeleteProfileModal>
              </div>
            </div>
          </div>
        </>
      </SettingsPagePaneLayout>
    </SettingsPageLayout>
  );
}
