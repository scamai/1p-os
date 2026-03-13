-- Vault: Documents with access control and source tracking

-- Access levels: owner (creator only), internal (all agents), team (all users), restricted (named agents only)
CREATE TYPE document_access_level AS ENUM ('owner', 'restricted', 'internal', 'team');
CREATE TYPE document_source AS ENUM ('upload', 'gmail', 'google_drive', 'outlook', 'slack', 'notion', 'dropbox', 'agent');
CREATE TYPE document_category AS ENUM ('contract', 'receipt', 'report', 'legal', 'tax', 'proposal', 'invoice', 'correspondence', 'other');

CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,

  -- File metadata
  name TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'application/pdf',
  file_size_bytes BIGINT DEFAULT 0,
  storage_path TEXT,

  -- Classification
  category document_category DEFAULT 'other',
  tags TEXT[] DEFAULT '{}',
  description TEXT,

  -- Access control
  access_level document_access_level DEFAULT 'internal',
  created_by_user_id UUID REFERENCES auth.users(id),
  created_by_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  allowed_agent_ids UUID[] DEFAULT '{}',  -- for 'restricted' access level

  -- Source tracking
  source document_source DEFAULT 'upload',
  source_integration_id UUID REFERENCES integrations(id) ON DELETE SET NULL,
  source_external_id TEXT,          -- ID in the external system (e.g. Google Drive file ID)
  source_url TEXT,                  -- Direct link to source
  source_synced_at TIMESTAMPTZ,

  -- Linking
  linked_entity_type TEXT,          -- 'relationship', 'project', 'invoice', etc.
  linked_entity_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_business ON documents(business_id);
CREATE INDEX idx_documents_category ON documents(business_id, category);
CREATE INDEX idx_documents_access ON documents(business_id, access_level);
CREATE INDEX idx_documents_source ON documents(business_id, source);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);

-- RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_business_documents" ON documents
  FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Access log for document views/downloads (audit trail)
CREATE TABLE document_access_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  accessed_by_user_id UUID REFERENCES auth.users(id),
  accessed_by_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  action TEXT NOT NULL DEFAULT 'view',  -- 'view', 'download', 'share', 'edit'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doc_access_log_doc ON document_access_log(document_id);
ALTER TABLE document_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_business_doc_access" ON document_access_log
  FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
