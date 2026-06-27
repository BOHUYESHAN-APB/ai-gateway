import { useEffect, useState } from 'react'
import {
  Card,
  NumberInput,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Text,
  Grid,
  ThemeIcon,
  Alert,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  IconDeviceDesktop,
  IconAdjustments,
  IconAlertTriangle,
  IconCheck,
} from '@tabler/icons-react'
import { getSettings, updateSettings } from '../api'
import { useAppContext } from '../ThemeContext'
import { t, type Locale } from '../i18n'

const LOG_OPTIONS = [
  { value: 'error', label: 'Error' },
  { value: 'warn', label: 'Warn' },
  { value: 'info', label: 'Info' },
  { value: 'debug', label: 'Debug' },
  { value: 'trace', label: 'Trace' },
]

function getLbOptions(locale: Locale) {
  return [
    { value: 'RoundRobin', label: t(locale, 'roundRobin') },
    { value: 'WeightedRandom', label: t(locale, 'weightedRandom') },
    { value: 'LeastConnections', label: t(locale, 'leastConnections') },
    { value: 'Priority', label: t(locale, 'priorityMode') },
    { value: 'LatencyBased', label: t(locale, 'latencyBased') },
  ]
}

export default function Settings() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { locale } = useAppContext()

  const form = useForm({
    initialValues: {
      admin_port: 1994,
      listen_host: '0.0.0.0',
      log_level: 'info',
      max_retries: 3,
      retry_backoff_ms: 1000,
      request_timeout_secs: 120,
      test_connection_timeout_secs: 10,
      lb_strategy: 'RoundRobin',
    },
  })

  const [originalPort, setOriginalPort] = useState<number>(1994)
  const [originalHost, setOriginalHost] = useState<string>('0.0.0.0')

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const data = await getSettings()
      form.setValues({
        admin_port: data.admin_port ?? 1994,
        listen_host: data.listen_host ?? data.host ?? '0.0.0.0',
        log_level: data.log_level ?? 'info',
        max_retries: data.max_retries ?? 3,
        retry_backoff_ms: data.retry_backoff_ms ?? 1000,
        request_timeout_secs: data.request_timeout_secs ?? 120,
        test_connection_timeout_secs: data.test_connection_timeout_secs ?? data.test_conn_timeout_secs ?? 10,
        lb_strategy: data.lb_strategy ?? data.default_lb_strategy ?? 'RoundRobin',
      })
      setOriginalPort(data.admin_port ?? 1994)
      setOriginalHost(data.listen_host ?? data.host ?? '0.0.0.0')
    } catch {
      notifications.show({
        message: t(locale, 'loadFailed'),
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const onSave = async (values: typeof form.values) => {
    setSaving(true)
    try {
      const portChanged = values.admin_port !== originalPort
      const hostChanged = values.listen_host !== originalHost

      await updateSettings({
        admin_port: values.admin_port,
        listen_host: values.listen_host,
        log_level: values.log_level,
        max_retries: values.max_retries,
        retry_backoff_ms: values.retry_backoff_ms,
        request_timeout_secs: values.request_timeout_secs,
        test_connection_timeout_secs: values.test_connection_timeout_secs,
        lb_strategy: values.lb_strategy,
      })

      if (portChanged || hostChanged) {
        notifications.show({
          title: t(locale, 'updateSuccess'),
          message: t(locale, 'portChangeHint'),
          color: 'yellow',
          icon: <IconAlertTriangle size={18} />,
        })
        setOriginalPort(values.admin_port)
        setOriginalHost(values.listen_host)
      } else {
        notifications.show({
          message: t(locale, 'updateSuccess'),
          color: 'green',
          icon: <IconCheck size={18} />,
        })
      }
    } catch {
      notifications.show({
        message: t(locale, 'updateFailed'),
        color: 'red',
      })
    } finally {
      setSaving(false)
    }
  }

  const lbOptions = getLbOptions(locale)

  return (
    <Stack gap="lg">
      {/* Header */}
      <Text fw={700} size="lg">
        {t(locale, 'settings')}
      </Text>

      <form onSubmit={form.onSubmit(onSave)}>
        <Stack gap="md">
          {/* Server Settings */}
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group gap="sm" mb="md">
              <ThemeIcon variant="light" size="lg" radius="md" color="blue">
                <IconDeviceDesktop size={18} />
              </ThemeIcon>
              <Text fw={600}>
                {t(locale, 'serverSettings')}
              </Text>
            </Group>

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <NumberInput
                  label={t(locale, 'adminPort')}
                  description={t(locale, 'adminPortDesc')}
                  min={1024}
                  max={65535}
                  {...form.getInputProps('admin_port')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <TextInput
                  label={t(locale, 'listenHost')}
                  description={t(locale, 'listenHostDesc')}
                  placeholder="0.0.0.0"
                  {...form.getInputProps('listen_host')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Select
                  label={t(locale, 'logLevel')}
                  description={t(locale, 'logLevelDesc')}
                  data={LOG_OPTIONS}
                  {...form.getInputProps('log_level')}
                />
              </Grid.Col>
            </Grid>

            <Alert
              variant="light"
              color="yellow"
              icon={<IconAlertTriangle size={16} />}
              mt="md"
              p="xs"
            >
              <Text size="xs">
                {t(locale, 'settingsNote')}
              </Text>
            </Alert>
          </Card>

          {/* Request Policy */}
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group gap="sm" mb="md">
              <ThemeIcon variant="light" size="lg" radius="md" color="violet">
                <IconAdjustments size={18} />
              </ThemeIcon>
              <Text fw={600}>
                {t(locale, 'defaultSettings')}
              </Text>
            </Group>

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <NumberInput
                  label={t(locale, 'maxRetries')}
                  description={t(locale, 'maxRetriesDesc')}
                  min={0}
                  max={10}
                  {...form.getInputProps('max_retries')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <NumberInput
                  label={t(locale, 'retryBackoffMs')}
                  description={t(locale, 'retryBackoffMsDesc')}
                  min={100}
                  {...form.getInputProps('retry_backoff_ms')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <NumberInput
                  label={t(locale, 'requestTimeoutSecs')}
                  description={t(locale, 'requestTimeoutSecsDesc')}
                  min={1}
                  {...form.getInputProps('request_timeout_secs')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <NumberInput
                  label={t(locale, 'testConnTimeoutSecs')}
                  description={t(locale, 'testConnTimeoutSecsDesc')}
                  min={1}
                  max={120}
                  {...form.getInputProps('test_connection_timeout_secs')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Select
                  label={t(locale, 'lbStrategyDefault')}
                  description={t(locale, 'lbStrategyDefaultDesc')}
                  data={lbOptions}
                  {...form.getInputProps('lb_strategy')}
                />
              </Grid.Col>
            </Grid>
          </Card>

          {/* Save Button */}
          <Group justify="flex-end">
            <Button
              type="submit"
              loading={saving}
              style={{ minWidth: 120 }}
            >
              {t(locale, 'save')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  )
}
