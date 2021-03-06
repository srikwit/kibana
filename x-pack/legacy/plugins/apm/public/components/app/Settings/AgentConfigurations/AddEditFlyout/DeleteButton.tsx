/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useState } from 'react';
import { EuiButtonEmpty } from '@elastic/eui';
import { NotificationsStart } from 'kibana/public';
import { i18n } from '@kbn/i18n';
import { Config } from '../index';
import { getOptionLabel } from '../../../../../../../../../plugins/apm/common/agent_configuration_constants';
import { callApmApi } from '../../../../../services/rest/createCallApmApi';
import { useApmPluginContext } from '../../../../../hooks/useApmPluginContext';

interface Props {
  onDeleted: () => void;
  selectedConfig: Config;
}

export function DeleteButton({ onDeleted, selectedConfig }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toasts } = useApmPluginContext().core.notifications;

  return (
    <EuiButtonEmpty
      color="danger"
      isLoading={isDeleting}
      iconSide="right"
      onClick={async () => {
        setIsDeleting(true);
        await deleteConfig(selectedConfig, toasts);
        setIsDeleting(false);
        onDeleted();
      }}
    >
      {i18n.translate(
        'xpack.apm.settings.agentConf.flyout.deleteSection.buttonLabel',
        { defaultMessage: 'Delete' }
      )}
    </EuiButtonEmpty>
  );
}

async function deleteConfig(
  selectedConfig: Config,
  toasts: NotificationsStart['toasts']
) {
  try {
    await callApmApi({
      pathname: '/api/apm/settings/agent-configuration',
      method: 'DELETE',
      params: {
        body: {
          service: {
            name: selectedConfig.service.name,
            environment: selectedConfig.service.environment
          }
        }
      }
    });

    toasts.addSuccess({
      title: i18n.translate(
        'xpack.apm.settings.agentConf.flyout.deleteSection.deleteConfigSucceededTitle',
        { defaultMessage: 'Configuration was deleted' }
      ),
      text: i18n.translate(
        'xpack.apm.settings.agentConf.flyout.deleteSection.deleteConfigSucceededText',
        {
          defaultMessage:
            'You have successfully deleted a configuration for "{serviceName}". It will take some time to propagate to the agents.',
          values: { serviceName: getOptionLabel(selectedConfig.service.name) }
        }
      )
    });
  } catch (error) {
    toasts.addDanger({
      title: i18n.translate(
        'xpack.apm.settings.agentConf.flyout.deleteSection.deleteConfigFailedTitle',
        { defaultMessage: 'Configuration could not be deleted' }
      ),
      text: i18n.translate(
        'xpack.apm.settings.agentConf.flyout.deleteSection.deleteConfigFailedText',
        {
          defaultMessage:
            'Something went wrong when deleting a configuration for "{serviceName}". Error: "{errorMessage}"',
          values: {
            serviceName: getOptionLabel(selectedConfig.service.name),
            errorMessage: error.message
          }
        }
      )
    });
  }
}
