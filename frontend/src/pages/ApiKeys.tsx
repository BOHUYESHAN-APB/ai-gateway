import { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Modal,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Text,
  Badge,
  ActionIcon,
  Tooltip,
  CopyButton,
  Popover,
  ThemeIcon,
  Center,
  Box,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  IconPlus,
  IconTrash,
  IconCopy,
  IconCheck,
  IconKey,
  IconAlertTriangle,
} from '@tabler/icons-react'
import { listApiKeys, createApiKey, deleteApiKey, listProxies } from '../api'
import { useAppContext } from '../ThemeContext'
import { t, type Locale } from '../i18n'

function maskKey(key: string): string {
  if (!key || key.length <= 8) return 'sk-****'
  return key.slice(0, 4) + '****' + key.slice(-4)
}

export default function ApiKeys() {
  const [keys, setKeys] = useState<any[]>([])
  const [proxies, setProxies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createdKey, setCreatedKey] = useState<string>('')
  const { locale } = useAppContext()

  const form = useForm({
    initialValues: {
      name: '',
      proxy_id: '' as string,
    },
    validate: {
      name: (v) => (v.trim() ? null : (locale === 'zh' ? '请输入名称' : 'Name is required')),
    },
  })

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [keyList, proxyList] = await Promise.all([
        listApiKeys().catch(() => []),
        listProxies().catch(() => []),
      ])
      setKeys(keyList)
      setProxies(proxyList)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (values: { name: string; proxy_id: string }) => {
    try {
      const result = await createApiKey({
        name: values.name,
        proxy_id: values.proxy_id || null,
      })
      const fullKey = result.key || ''
      setCreatedKey(fullKey)
      notifications.show({
        title: t(locale, 'createSuccess'),
        message: t(locale, 'apiKeyCreatedTip'),
        color: 'green',
      })
      loadAll()
    } catch {
      notifications.show({
        title: t(locale, 'createFailed'),
        message: '',
        color: 'red',
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteApiKey(id)
      notifications.show({
        message: t(locale, 'deleteSuccess'),
        color: 'green',
      })
      loadAll()
    } catch {
      // silently fail
    }
  }

  const openCreateModal = () => {
    form.reset()
    setCreatedKey('')
    setCreateOpen(true)
  }

  const closeCreateModal = () => {
    setCreateOpen(false)
    setCreatedKey('')
    form.reset()
  }

  const proxyOptions = [
    { value: '', label: t(locale, 'apiKeyProxyAll') },
    ...proxies.map((p: any) => ({ value: p.id, label: p.name })),
  ]

  const rows = keys.map((row) => (
    <Table.Tr key={row.id}>
      <Table.Td>
        <Text fw={500} size="sm">
          {row.name}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <Text size="sm" ff="monospace" c="dimmed">
            {maskKey(row.key)}
          </Text>
          <CopyButton value={row.key}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? (locale === 'zh' ? '已复制' : 'Copied') : (locale === 'zh' ? '复制' : 'Copy')}>
                <ActionIcon
                  variant="subtle"
                  color={copied ? 'teal' : 'gray'}
                  size="sm"
                  onClick={copy}
                >
                  {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        </Group>
      </Table.Td>
      <Table.Td>
        {row.proxy_name ? (
          <Badge variant="light" color="violet" size="sm">
            {row.proxy_name}
          </Badge>
        ) : (
          <Badge variant="outline" color="gray" size="sm">
            {t(locale, 'apiKeyProxyAll')}
          </Badge>
        )}
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed">
          {row.created_at ? new Date(row.created_at).toLocaleString() : '-'}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed">
          {row.last_used ? new Date(row.last_used).toLocaleString() : t(locale, 'neverUsed')}
        </Text>
      </Table.Td>
      <Table.Td>
        <Popover
          width={200}
          position="bottom-end"
          withArrow
          shadow="md"
        >
          <Popover.Target>
            <ActionIcon variant="subtle" color="red" size="sm">
              <IconTrash size={16} />
            </ActionIcon>
          </Popover.Target>
          <Popover.Dropdown>
            <Stack gap="xs">
              <Text size="sm">{t(locale, 'deleteConfirm')}</Text>
              <Group justify="flex-end">
                <Button
                  size="xs"
                  variant="default"
                  onClick={() => {}}
                >
                  {t(locale, 'cancel')}
                </Button>
                <Button
                  size="xs"
                  color="red"
                  onClick={() => handleDelete(row.id)}
                >
                  {t(locale, 'delete')}
                </Button>
              </Group>
            </Stack>
          </Popover.Dropdown>
        </Popover>
      </Table.Td>
    </Table.Tr>
  ))

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <Text fw={700} size="lg">
          {t(locale, 'apiKeys')}
        </Text>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={openCreateModal}
        >
          {t(locale, 'newApiKey')}
        </Button>
      </Group>

      {/* Table */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        {keys.length === 0 && !loading ? (
          <Center py="xl">
            <Stack align="center" gap="xs">
              <ThemeIcon variant="light" size={48} radius="xl" color="gray">
                <IconKey size={24} />
              </ThemeIcon>
              <Text size="sm" c="dimmed">
                {locale === 'zh' ? '暂无 API Key，点击上方按钮创建' : 'No API keys yet. Click above to create one.'}
              </Text>
            </Stack>
          </Center>
        ) : (
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t(locale, 'apiKeyName')}</Table.Th>
                <Table.Th>{t(locale, 'apiKeyKey')}</Table.Th>
                <Table.Th>{t(locale, 'apiKeyProxy')}</Table.Th>
                <Table.Th>{t(locale, 'apiKeyCreatedAt')}</Table.Th>
                <Table.Th>{t(locale, 'lastUsed')}</Table.Th>
                <Table.Th>{t(locale, 'action')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        opened={createOpen}
        onClose={closeCreateModal}
        title={t(locale, 'newApiKey')}
        size="md"
        closeOnClickOutside={false}
      >
        {createdKey ? (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              {t(locale, 'apiKeyCreatedTip')}
            </Text>
            <Card
              shadow="xs"
              padding="md"
              radius="sm"
              withBorder
              style={{ background: 'var(--mantine-color-gray-0)' }}
            >
              <Group justify="space-between" align="center" wrap="nowrap">
                <Text ff="monospace" size="sm" style={{ wordBreak: 'break-all' }}>
                  {createdKey}
                </Text>
                <CopyButton value={createdKey}>
                  {({ copied, copy }) => (
                    <Button
                      size="xs"
                      variant={copied ? 'filled' : 'light'}
                      color={copied ? 'teal' : 'blue'}
                      leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      onClick={copy}
                    >
                      {copied ? (locale === 'zh' ? '已复制' : 'Copied') : (locale === 'zh' ? '复制' : 'Copy')}
                    </Button>
                  )}
                </CopyButton>
              </Group>
            </Card>
            <Group gap="xs" align="center">
              <ThemeIcon variant="light" color="yellow" size="sm">
                <IconAlertTriangle size={14} />
              </ThemeIcon>
              <Text size="xs" c="orange">
                {t(locale, 'apiKeyCopyWarning')}
              </Text>
            </Group>
            <Group justify="flex-end">
              <Button onClick={closeCreateModal}>
                {t(locale, 'confirm')}
              </Button>
            </Group>
          </Stack>
        ) : (
          <form onSubmit={form.onSubmit(handleCreate)}>
            <Stack gap="md">
              <TextInput
                label={t(locale, 'apiKeyName')}
                placeholder={t(locale, 'apiKeyNamePlaceholder')}
                required
                {...form.getInputProps('name')}
              />
              <Select
                label={t(locale, 'apiKeyProxy')}
                placeholder={t(locale, 'apiKeyProxyAll')}
                data={proxyOptions}
                clearable
                {...form.getInputProps('proxy_id')}
              />
              <Group justify="flex-end">
                <Button variant="default" onClick={closeCreateModal}>
                  {t(locale, 'cancel')}
                </Button>
                <Button type="submit">
                  {t(locale, 'create')}
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Modal>
    </Stack>
  )
}
