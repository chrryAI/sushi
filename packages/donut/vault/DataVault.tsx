"use client"
import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { useAuth } from "../context/providers"
import {
  Database,
  FileStack,
  GitBranch,
  HardDrive,
  RefreshCw,
  Server,
  Trash2,
} from "../icons"
import { Button, Div, Input, P, usePlatform } from "../platform"
import { API_URL, apiFetch } from "../utils"
import { useDataVaultStyles } from "./DataVault.styles"

// ─── Types ────────────────────────────────────────────────────────

type TableInfo = { name: string; label: string; rows: number }
type TableRow = Record<string, any>

type RedisNs = { prefix: string; label: string; count: number }
type RedisKey = { key: string; ttl: number; type: string }

type HippoFile = {
  hippoId: string
  appId?: string
  name: string
  url?: string
  size?: number
  type?: string
  createdOn: string
}

type TabId = "postgres" | "redis" | "falkor" | "files"

// ─── Main Component ───────────────────────────────────────────────

export default function DataVault() {
  const s = useDataVaultStyles()
  const { member, guest } = useAuth() as any
  const { isWeb } = usePlatform()
  const isAdmin = member?.roles?.includes("admin") || member?.role === "admin"

  const [activeTab, setActiveTab] = useState<TabId>("postgres")

  const TABS: {
    id: TabId
    label: string
    icon: React.ReactNode
    adminOnly?: boolean
  }[] = [
    { id: "postgres", label: "Postgres", icon: <Database size={14} /> },
    {
      id: "redis",
      label: "Redis",
      icon: <Server size={14} />,
      adminOnly: true,
    },
    { id: "falkor", label: "FalkorDB", icon: <GitBranch size={14} /> },
    { id: "files", label: "Files", icon: <FileStack size={14} /> },
  ]

  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin)

  return (
    <Div style={s.container}>
      {/* Header */}
      <Div style={s.header}>
        <HardDrive size={18} />
        <P style={s.headerTitle}>Data Vault</P>
        <P style={s.headerSub}>Your sovereign data — full control</P>
      </Div>

      {/* Tab bar */}
      <Div style={s.tabBar}>
        {visibleTabs.map((tab) => (
          <Div
            key={tab.id}
            style={activeTab === tab.id ? s.tabActive : s.tab}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </Div>
        ))}
      </Div>

      {/* Tab content */}
      <Div style={s.tabContent}>
        {activeTab === "postgres" && <PostgresTab />}
        {activeTab === "redis" && isAdmin && <RedisTab />}
        {activeTab === "falkor" && <FalkorTab />}
        {activeTab === "files" && <FilesTab />}
      </Div>
    </Div>
  )
}

// ─────────────────────────────────────────────────────────────────
// POSTGRES TAB
// ─────────────────────────────────────────────────────────────────

function PostgresTab() {
  const s = useDataVaultStyles()
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [rows, setRows] = useState<TableRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiFetch(`${API_URL}/data-vault/postgres/tables`)
      .then((r: any) => setTables(r.tables ?? []))
      .catch(console.error)
  }, [])

  const loadRows = useCallback(
    async (tableName: string, p = 1, search = "") => {
      setLoading(true)
      try {
        const res: any = await apiFetch(
          `${API_URL}/data-vault/postgres/rows?table=${tableName}&page=${p}&q=${encodeURIComponent(search)}`,
        )
        setRows(res.rows ?? [])
        setTotal(res.total ?? 0)
        setPage(p)
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const selectTable = (name: string) => {
    setSelected(name)
    setQ("")
    loadRows(name, 1, "")
  }

  const deleteRow = async (id: string) => {
    if (!selected) return
    await apiFetch(`${API_URL}/data-vault/postgres/row`, {
      method: "DELETE",
      body: JSON.stringify({ table: selected, id }),
    })
    loadRows(selected, page, q)
  }

  const columns = rows[0]
    ? Object.keys(rows[0]).filter((k) => k !== "embedding")
    : []

  return (
    <Div style={s.tabPane}>
      {/* Table list */}
      <Div style={s.tableList}>
        {tables.map((t) => (
          <Div
            key={t.name}
            style={selected === t.name ? s.tableItemActive : s.tableItem}
            onClick={() => selectTable(t.name)}
          >
            <P style={s.tableItemName}>{t.label}</P>
            <P style={s.tableItemCount}>{t.rows.toLocaleString()}</P>
          </Div>
        ))}
      </Div>

      {/* Row viewer */}
      {selected && (
        <Div style={s.rowViewer}>
          <Div style={s.rowViewerHeader}>
            <Input
              value={q}
              onChange={(e: any) => {
                setQ(e.target.value)
                loadRows(selected, 1, e.target.value)
              }}
              placeholder="Search…"
              style={s.searchInput}
            />
            <P style={s.rowCount}>{total.toLocaleString()} rows</P>
          </Div>

          {loading ? (
            <Div style={s.centered}>
              <RefreshCw size={18} />
            </Div>
          ) : (
            <Div style={s.tableWrapper}>
              <table style={s.table as any}>
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col} style={s.th as any}>
                        {col}
                      </th>
                    ))}
                    <th style={s.th as any}>—</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} style={s.tr as any}>
                      {columns.map((col) => (
                        <td key={col} style={s.td as any}>
                          <span style={s.cellValue as any}>
                            {formatCell(row[col])}
                          </span>
                        </td>
                      ))}
                      <td style={s.td as any}>
                        <Button
                          onClick={() => deleteRow(row.id)}
                          style={s.deleteBtn}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Div>
          )}

          {/* Pagination */}
          <Div style={s.pagination}>
            <Button
              disabled={page <= 1}
              onClick={() => loadRows(selected, page - 1, q)}
              style={s.pageBtn}
            >
              ←
            </Button>
            <P style={s.pageInfo}>
              Page {page} of {Math.ceil(total / 25)}
            </P>
            <Button
              disabled={page * 25 >= total}
              onClick={() => loadRows(selected, page + 1, q)}
              style={s.pageBtn}
            >
              →
            </Button>
          </Div>
        </Div>
      )}
    </Div>
  )
}

// ─────────────────────────────────────────────────────────────────
// REDIS TAB  (admin only)
// ─────────────────────────────────────────────────────────────────

function RedisTab() {
  const s = useDataVaultStyles()
  const [namespaces, setNamespaces] = useState<RedisNs[]>([])
  const [selectedNs, setSelectedNs] = useState<string | null>(null)
  const [keys, setKeys] = useState<RedisKey[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [value, setValue] = useState<any>(null)
  const [memUsed, setMemUsed] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiFetch(`${API_URL}/data-vault/redis/namespaces`)
      .then((r: any) => {
        setNamespaces(r.namespaces ?? [])
        setMemUsed(r.memoryUsed ?? "—")
      })
      .catch(console.error)
  }, [])

  const loadKeys = async (prefix: string) => {
    setSelectedNs(prefix)
    setSelectedKey(null)
    setValue(null)
    setLoading(true)
    try {
      const r: any = await apiFetch(
        `${API_URL}/data-vault/redis/keys?prefix=${encodeURIComponent(prefix)}`,
      )
      setKeys(r.keys ?? [])
    } finally {
      setLoading(false)
    }
  }

  const loadValue = async (key: string) => {
    setSelectedKey(key)
    const r: any = await apiFetch(
      `${API_URL}/data-vault/redis/value?key=${encodeURIComponent(key)}`,
    )
    setValue(r.value)
  }

  const flushNs = async (prefix: string) => {
    await apiFetch(`${API_URL}/data-vault/redis/key`, {
      method: "DELETE",
      body: JSON.stringify({ prefix }),
    })
    loadKeys(prefix)
  }

  const deleteKey = async (key: string) => {
    await apiFetch(`${API_URL}/data-vault/redis/key`, {
      method: "DELETE",
      body: JSON.stringify({ key }),
    })
    setKeys((prev) => prev.filter((k) => k.key !== key))
  }

  return (
    <Div style={s.tabPane}>
      <Div style={s.tableList}>
        <P style={s.sectionLabel}>Memory used: {memUsed}</P>
        {namespaces.map((ns) => (
          <Div
            key={ns.prefix}
            style={selectedNs === ns.prefix ? s.tableItemActive : s.tableItem}
            onClick={() => loadKeys(ns.prefix)}
          >
            <P style={s.tableItemName}>{ns.label}</P>
            <Div style={s.rowItemRight}>
              <P style={s.tableItemCount}>{ns.count}</P>
              <Button
                onClick={(e: any) => {
                  e.stopPropagation()
                  flushNs(ns.prefix)
                }}
                style={s.deleteBtn}
              >
                <Trash2 size={11} />
              </Button>
            </Div>
          </Div>
        ))}
      </Div>

      {selectedNs && (
        <Div style={s.rowViewer}>
          {loading ? (
            <Div style={s.centered}>
              <RefreshCw size={18} />
            </Div>
          ) : (
            <>
              <Div style={s.keyList}>
                {keys.map((k) => (
                  <Div
                    key={k.key}
                    style={
                      selectedKey === k.key ? s.tableItemActive : s.tableItem
                    }
                    onClick={() => loadValue(k.key)}
                  >
                    <P style={s.keyName}>{k.key.split(":").pop()}</P>
                    <Div style={s.rowItemRight}>
                      <P style={s.tableItemCount}>
                        {k.ttl > 0 ? `${k.ttl}s` : "∞"}
                      </P>
                      <Button
                        onClick={(e: any) => {
                          e.stopPropagation()
                          deleteKey(k.key)
                        }}
                        style={s.deleteBtn}
                      >
                        <Trash2 size={11} />
                      </Button>
                    </Div>
                  </Div>
                ))}
              </Div>
              {value !== null && (
                <Div style={s.valuePane}>
                  <P style={s.sectionLabel}>{selectedKey}</P>
                  <pre style={s.valueCode as any}>
                    {JSON.stringify(value, null, 2)}
                  </pre>
                </Div>
              )}
            </>
          )}
        </Div>
      )}
    </Div>
  )
}

// ─────────────────────────────────────────────────────────────────
// FALKORDB TAB
// ─────────────────────────────────────────────────────────────────

function FalkorTab() {
  const s = useDataVaultStyles()
  const [stats, setStats] = useState<{ nodes: number; edges: number } | null>(
    null,
  )
  const [nodes, setNodes] = useState<any[]>([])
  const [label, setLabel] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiFetch(`${API_URL}/data-vault/falkor/stats`)
      .then((r: any) => setStats(r))
      .catch(console.error)
  }, [])

  const loadNodes = async () => {
    setLoading(true)
    try {
      const r: any = await apiFetch(
        `${API_URL}/data-vault/falkor/nodes?label=${encodeURIComponent(label)}&limit=50`,
      )
      setNodes(r.nodes ?? [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Div style={s.tabPane}>
      {stats && (
        <Div style={s.statRow}>
          <Div style={s.statCard}>
            <P style={s.statValue}>{stats.nodes.toLocaleString()}</P>
            <P style={s.statLabel}>Nodes</P>
          </Div>
          <Div style={s.statCard}>
            <P style={s.statValue}>{stats.edges.toLocaleString()}</P>
            <P style={s.statLabel}>Edges</P>
          </Div>
        </Div>
      )}

      <Div style={s.rowViewerHeader}>
        <Input
          value={label}
          onChange={(e: any) => setLabel(e.target.value)}
          placeholder="Label (e.g. Memory, Entity)"
          style={s.searchInput}
        />
        <Button onClick={loadNodes} style={s.pageBtn}>
          Browse
        </Button>
      </Div>

      {loading ? (
        <Div style={s.centered}>
          <RefreshCw size={18} />
        </Div>
      ) : (
        <Div style={s.nodeList}>
          {nodes.map((node, i) => (
            <Div key={i} style={s.nodeCard}>
              <pre style={s.valueCode as any}>
                {JSON.stringify(node, null, 2)}
              </pre>
            </Div>
          ))}
        </Div>
      )}
    </Div>
  )
}

// ─────────────────────────────────────────────────────────────────
// FILES TAB
// ─────────────────────────────────────────────────────────────────

function FilesTab() {
  const s = useDataVaultStyles()
  const [files, setFiles] = useState<HippoFile[]>([])
  const [storage, setStorage] = useState<{
    totalFiles: number
    totalMb: string
  } | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const [listRes, storageRes]: any[] = await Promise.all([
        apiFetch(`${API_URL}/data-vault/files/list?page=${p}`),
        apiFetch(`${API_URL}/data-vault/files/storage`),
      ])
      setFiles(listRes.files ?? [])
      setTotal(listRes.total ?? 0)
      setPage(p)
      setStorage(storageRes)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const deleteFile = async (hippoId: string) => {
    await apiFetch(`${API_URL}/data-vault/files/${hippoId}`, {
      method: "DELETE",
    })
    load(page)
  }

  return (
    <Div style={s.tabPane}>
      {storage && (
        <Div style={s.statRow}>
          <Div style={s.statCard}>
            <P style={s.statValue}>{storage.totalFiles}</P>
            <P style={s.statLabel}>Files</P>
          </Div>
          <Div style={s.statCard}>
            <P style={s.statValue}>{storage.totalMb} MB</P>
            <P style={s.statLabel}>Used</P>
          </Div>
        </Div>
      )}

      {loading ? (
        <Div style={s.centered}>
          <RefreshCw size={18} />
        </Div>
      ) : (
        <Div style={s.fileGrid}>
          {files.map((f, i) => (
            <Div key={i} style={s.fileCard}>
              <Div style={s.fileCardTop}>
                <P style={s.fileName}>{f.name}</P>
                <Button
                  onClick={() => deleteFile(f.hippoId)}
                  style={s.deleteBtn}
                >
                  <Trash2 size={12} />
                </Button>
              </Div>
              <P style={s.fileMeta}>
                {f.type ?? "—"} · {formatBytes(f.size)} ·{" "}
                {formatDate(f.createdOn)}
              </P>
              {f.url && (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  style={s.fileLink as any}
                >
                  Open ↗
                </a>
              )}
            </Div>
          ))}
        </Div>
      )}

      <Div style={s.pagination}>
        <Button
          disabled={page <= 1}
          onClick={() => load(page - 1)}
          style={s.pageBtn}
        >
          ←
        </Button>
        <P style={s.pageInfo}>
          Page {page} of {Math.ceil(total / 20)}
        </P>
        <Button
          disabled={page * 20 >= total}
          onClick={() => load(page + 1)}
          style={s.pageBtn}
        >
          →
        </Button>
      </Div>
    </Div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────

function formatCell(val: any): string {
  if (val === null || val === undefined) return "—"
  if (typeof val === "object") return JSON.stringify(val).slice(0, 80)
  const str = String(val)
  return str.length > 80 ? `${str.slice(0, 80)}…` : str
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString()
  } catch {
    return iso
  }
}
