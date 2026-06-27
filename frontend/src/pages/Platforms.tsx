import { useEffect, useState } from 'react'
import {
  Table,
  Modal,
  Select,
  TextInput,
  PasswordInput,
  Button,
  Group,
  Stack,
  Text,
  Badge,
  ActionIcon,
  Card,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconPlugConnected,
} from '@tabler/icons-react'
import { listPlatforms, createPlatform, updatePlatform, deletePlatform } from '../api'
import { useAppContext } from '../ThemeContext'
import { t, type Locale, type TranslationKey } from '../i18n'
import { platformPresets, getPresetName } from '../presets'

const PLATFORM_TYPES = [
  { value: 'OpenAI', labelKey: 'openaiType' as TranslationKey },
  { value: 'Anthropic', labelKey: 'anthropicType' as TranslationKey },
  { value: 'Ollama', labelKey: 'ollamaType' as TranslationKey },
  { value: 'Azure', labelKey: 'azureType' as TranslationKey },
  { value: 'Custom', labelKey: 'customType' as TranslationKey },
]

function getPlatformTypeLabel(value: string, locale: Locale): string {
  const entry = PLATFORM_TYPES.find(pt => pt.value === value)
  return entry ? t(locale, entry.labelKey) : value
}

interface PlatformFormValues {
  name: string
  type: string
  base_url: string
  api_key: string
  organization: string
}

const emptyForm: PlatformFormValues = {
  name: '',
  type: 'OpenAI',
  base_url: '',
  api_key: '',
  organization: '',
}

export default function Platforms() {
  const [platforms, setPlatforms] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [formValues, setFormValues] = useState<PlatformFormValues>({ ...emptyForm })
  const [presetValue, setPresetValue] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const { locale } = useAppContext()

  useEffect(() => { loadPlatforms() }, [])

  const loadPlatforms = async () => {
    setLoading(true)
    try {
      setPlatforms(await listPlatforms())
    } catch {
      notifications.show({
        title: t(locale, 'loadFailed'),
        message: '',
        color: 'red',
      })
    }
    setLoading(false)
  }

  const openCreate = () => {
    setEditItem(null)
    setFormValues({ ...emptyForm })
    setPresetValue(null)
    openModal()
  }

  const openEdit = (record: any) => {
    setEditItem(record)
    setFormValues({
      name: record.name || '',
      type: record.type || 'OpenAI',
      base_url: record.base_url || '',
      api_key: record.api_key || '',
      organization: record.organization || '',
    })
    setPresetValue(null)
    openModal()
  }

  const applyPreset = (presetName: string | null) => {
    setPresetValue(presetName)
    if (!presetName) return
    const preset = platformPresets.find(p => p.name === presetName)
    if (preset) {
      setFormValues(prev => ({
        ...prev,
        name: preset.name,
        type: preset.platform_type,
        base_url: preset.base_url,
      }))
    }
  }

  const handleSubmit = async () => {
    if (!formValues.name || !formValues.type || !formValues.base_url) return

    const payload = {
      name: formValues.name,
      type: formValues.type,
      base_url: formValues.base_url,
      api_key: formValues.api_key,
      organization: formValues.organization || undefined,
    }

    try {
      if (editItem) {
        await updatePlatform(editItem.id, payload)
        notifications.show({
          message: t(locale, 'updateSuccess'),
          color: 'green',
        })
      } else {
        await createPlatform(payload)
        notifications.show({
          message: t(locale, 'createSuccess'),
          color: 'green',
        })
      }
      closeModal()
      setEditItem(null)
      setFormValues({ ...emptyForm })
      loadPlatforms()
    } catch (e: any) {
      notifications.show({
        title: editItem ? t(locale, 'updateFailed') : t(locale, 'createFailed'),
        message: e?.response?.data?.error?.message || '',
        color: 'red',
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deletePlatform(id)
      notifications.show({
        message: t(locale, 'deleteSuccess'),
        color: 'green',
      })
      setDeleteConfirmId(null)
      loadPlatforms()
    } catch {
      notifications.show({
        message: t(locale, 'loadFailed'),
        color: 'red',
      })
    }
  }

  const updateField = <K extends keyof PlatformFormValues>(key: K, value: PlatformFormValues[K]) => {
    setFormValues(prev => ({ ...prev, [key]: value }))
  }

  const presetSelectData = platformPresets.map(p => ({
    value: p.name,
    label: getPresetName(p, locale),
  }))

  const typeSelectData = PLATFORM_TYPES.map(pt => ({
    value: pt.value,
    label: t(locale, pt.labelKey),
  }))

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group gap="xs">
          <IconPlugConnected size={22} stroke={1.5} />
          <Text fw={600} size="lg">{t(locale, 'platforms')}</Text>
        </Group>
        <Group gap="xs">
          <Button
            variant="subtle"
            size="compact-sm"
            leftSection={<IconRefresh size={16} />}
            onClick={loadPlatforms}
          >
            {t(locale, 'refresh')}
          </Button>
          <Button
            size="compact-sm"
            leftSection={<IconPlus size={16} />}
            onClick={openCreate}
          >
            {t(locale, 'addPlatform')}
          </Button>
        </Group>
      </Group>

      <Card withBorder padding={0}>
        <Table
          highlightOnHover
          verticalSpacing="sm"
          horizontalSpacing="md"
          stickyHeader
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t(locale, 'name')}</Table.Th>
              <Table.Th>{t(locale, 'type')}</Table.Th>
              <Table.Th>{t(locale, 'baseUrl')}</Table.Th>
              <Table.Th>API Key</Table.Th>
              <Table.Th>{t(locale, 'action')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading && platforms.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text c="dimmed" ta="center" py="md">
                    {t(locale, 'loading')}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {!loading && platforms.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text c="dimmed" ta="center" py="md">
                    {t(locale, 'noPlatforms')}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {platforms.map((platform) => {
              const preset = platformPresets.find(p => p.name === platform.name)
              const displayName = preset ? getPresetName(preset, locale) : platform.name

              return (
                <Table.Tr key={platform.id}>
                  <Table.Td>
                    <Text fw={500}>{displayName}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" size="sm">
                      {getPlatformTypeLabel(platform.type, locale)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" truncate maw={320}>
                      {platform.base_url}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {platform.api_key ? (
                      <Text size="sm" ff="monospace" c="dimmed">
                        {platform.api_key.slice(0, 8)}...
                      </Text>
                    ) : (
                      <Text size="sm" c="dimmed">-</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={() => openEdit(platform)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      {deleteConfirmId === platform.id ? (
                        <Group gap={4} wrap="nowrap">
                          <ActionIcon
                            variant="filled"
                            color="red"
                            size="sm"
                            onClick={() => handleDelete(platform.id)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            <Text size="xs">X</Text>
                          </ActionIcon>
                        </Group>
                      ) : (
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          onClick={() => setDeleteConfirmId(platform.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              )
            })}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal
        opened={modalOpen}
        onClose={() => { closeModal(); setEditItem(null) }}
        title={editItem ? t(locale, 'editPlatform') : t(locale, 'addPlatform')}
        size="lg"
        closeOnClickOutside={false}
      >
        <Stack gap="md">
          {!editItem && (
            <Select
              label={t(locale, 'quickPreset')}
              placeholder={t(locale, 'quickPreset')}
              data={presetSelectData}
              value={presetValue}
              onChange={applyPreset}
              searchable
              clearable
            />
          )}

          <TextInput
            label={t(locale, 'platformName')}
            placeholder="OpenAI, DeepSeek, etc."
            required
            value={formValues.name}
            onChange={(e) => updateField('name', e.currentTarget.value)}
          />

          <Select
            label={t(locale, 'platformType')}
            data={typeSelectData}
            required
            value={formValues.type}
            onChange={(val) => updateField('type', val || 'OpenAI')}
          />

          <TextInput
            label={t(locale, 'baseUrl')}
            placeholder="https://api.openai.com/v1"
            required
            value={formValues.base_url}
            onChange={(e) => updateField('base_url', e.currentTarget.value)}
          />

          <PasswordInput
            label={t(locale, 'apiKey')}
            placeholder="sk-..."
            value={formValues.api_key}
            onChange={(e) => updateField('api_key', e.currentTarget.value)}
          />

          <TextInput
            label={t(locale, 'organization')}
            placeholder="org-xxx (optional)"
            value={formValues.organization}
            onChange={(e) => updateField('organization', e.currentTarget.value)}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => { closeModal(); setEditItem(null) }}>
              {t(locale, 'cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formValues.name || !formValues.type || !formValues.base_url}
            >
              {editItem ? t(locale, 'save') : t(locale, 'create')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
