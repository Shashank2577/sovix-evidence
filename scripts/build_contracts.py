"""Generate the specification's OpenAPI and standalone JSON Schemas; no application code."""
import copy, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'specs/001-sovix-evidence/contracts'
def st(maxlen=200):return {'type':'string','minLength':1,'maxLength':maxlen}
def enum(*xs):return {'type':'string','enum':list(xs)}
def arr(items, minimum=0):return {'type':'array','items':items,'minItems':minimum,'maxItems':10000}
def obj(props,required=None):return {'type':'object','properties':props,'required':list(props) if required is None else required,'additionalProperties':False}
def ref(n):return {'$ref':'#/components/schemas/'+n}
def nullable(s):return {'anyOf':[s,{'type':'null'}]}
ID={'type':'string','format':'uuid'};DT={'type':'string','format':'date-time'};URI={'type':'string','format':'uri'}
N={'type':'integer','minimum':0,'maximum':9007199254740991};BOOL={'type':'boolean'}
MONEY={'type':'string','pattern':r'^(0|[1-9][0-9]*)\.[0-9]{6}$'}
SHA={'type':'string','pattern':'^[0-9a-f]{40}([0-9a-f]{24})?$'}
DIGEST={'type':'string','pattern':'^[0-9a-f]{64}$'}
S={}
S['Window']=obj({'start':DT,'end':DT})
S['Scope']=obj({'project_ids':arr(ID,1),'repository_ids':arr(ID),'timezone':st(100)})
S['Coverage']=obj({'collection':enum('complete','partial','unknown'),'observed_records':N,'eligible_records':N,'expected_records':nullable(N),'instrumentation':enum('complete','partial','unknown','not_applicable'),'linkage':enum('complete','partial','unknown','not_applicable'),'watermark':nullable(DT),'reasons':arr(st(500))})
S['EvidenceRef']=obj({'source_revision_id':ID,'kind':st(60),'label':st(500),'url':nullable(URI)})
S['InputValue']={'anyOf':[{'type':'number'},st(1000),BOOL,{'type':'null'}]}
S['MetricResult']=obj({'id':ID,'metric_id':st(150),'metric_version':st(30),'kind':enum('measured','proxy','inferred'),'availability':enum('available','partial','unavailable','suppressed'),'reason':nullable(st(500)),'value':{'anyOf':[{'type':'number'},MONEY,{'type':'null'}]},'unit':enum('count','percent','ratio','hours','seconds','usd','per_week'),'scope':ref('Scope'),'window':ref('Window'),'formula':st(2000),'inputs':{'type':'object','additionalProperties':ref('InputValue'),'minProperties':1},'sample_n':N,'population_n':nullable(N),'coverage':ref('Coverage'),'exclusions':{'type':'object','additionalProperties':N},'evidence':arr(ref('EvidenceRef')),'limitations':arr(st(1000),1),'calculator_version':st(100),'config_digest':DIGEST,'digest':DIGEST})
S['MetricResult']['allOf']=[{'if':{'properties':{'availability':{'enum':['unavailable','suppressed']}}},'then':{'properties':{'value':{'type':'null'},'reason':st(500)}},'else':{'properties':{'value':{'anyOf':[{'type':'number'},MONEY]}}}}]
S['Problem']=obj({'type':URI,'title':st(200),'status':{'type':'integer','minimum':400,'maximum':599},'code':st(80),'detail':st(1000),'request_id':ID},['type','title','status','code','request_id'])
S['Job']=obj({'id':ID,'workspace_id':ID,'type':st(80),'state':enum('queued','running','retrying','succeeded','partially_succeeded','failed','cancel_requested','canceled'),'attempt':N,'progress':{'type':'number','minimum':0,'maximum':1},'error':nullable(ref('Problem')),'resource_id':nullable(ID),'result_url':nullable(st(1000)),'created_at':DT,'updated_at':DT})
S['WorkspaceCreate']=obj({'name':st(120),'slug':{'type':'string','pattern':'^[a-z0-9][a-z0-9-]{1,62}$'}})
S['Workspace']=obj({'id':ID,'name':st(120),'slug':st(63),'profile':enum('local','hosted'),'status':enum('active','deleting','deleted'),'version':N})
S['ProjectCreate']=obj({'name':st(120),'slug':st(63),'timezone':st(100)})
S['Project']=obj({'id':ID,'workspace_id':ID,'name':st(120),'slug':st(63),'timezone':st(100),'status':enum('active','deleting','deleted'),'version':N})
S['MembershipWrite']=obj({'user_id':ID,'role':enum('owner','admin','analyst','viewer'),'all_projects':BOOL,'project_ids':arr(ID)})
S['Membership']=obj({'id':ID,**S['MembershipWrite']['properties'],'status':enum('active','revoked'),'version':N})
S['Identity']=obj({'user_id':ID,'display_label':st(120),'workspace_ids':arr(ID)})
S['Repository']=obj({'id':ID,'host':st(100),'host_repo_id':st(100),'name':st(200),'project_ids':arr(ID),'default_branch':st(250),'visibility':enum('public','private','internal'),'status':enum('active','archived','revoked','removed'),'version':N})
S['RepositoryMapping']=obj({'project_ids':arr(ID,1)})
S['ConnectorCreate']=obj({'kind':enum('github','legacy_import','otlp','deployment','incident'),'name':st(120),'project_ids':arr(ID,1),'credential_ref':nullable(st(250)),'installation_id':nullable(st(100))})
S['Connector']=obj({'id':ID,'kind':st(50),'name':st(120),'project_ids':arr(ID),'status':enum('pending','active','degraded','disabled','revoked'),'capabilities':arr(st(120)),'last_attempt_at':nullable(DT),'last_success_at':nullable(DT),'coverage':ref('Coverage'),'version':N})
S['Reason']=obj({'reason':st(1000)})
S['SyncRequest']=obj({'window':ref('Window'),'repository_ids':arr(ID),'refresh':BOOL})
S['ImportRequest']=obj({'project_id':ID,'format':enum('sovix_v1','receipts_1_0'),'source_name':st(120),'payload':{'type':'object','description':'Version-specific legacy report. Strictly validated by selected legacy adapter before normalization; never interpreted as arbitrary domain fields.','additionalProperties':True}})
S['CollectorCreate']=obj({'connector_id':ID,'runtime':enum('codex_cli','claude_code','cursor','copilot_cli','generic_otlp'),'runtime_version':st(100),'adapter_version':st(100),'project_ids':arr(ID,1),'expires_at':DT})
S['Collector']=obj({'id':ID,'connector_id':ID,'runtime':st(80),'runtime_version':st(100),'adapter_version':st(100),'project_ids':arr(ID),'capabilities':arr(st(120)),'status':enum('active','revoked','expired','unverified'),'expires_at':DT})
S['CollectorSecret']=obj({'collector':ref('Collector'),'ingest_token':{'type':'string','minLength':32,'writeOnly':False},'otlp_endpoint':URI})
S['Session']=obj({'id':ID,'project_id':ID,'repository_id':nullable(ID),'runtime':st(80),'started_at':DT,'ended_at':nullable(DT),'state':enum('open','completed','interrupted'),'model_ids':arr(st(150)),'coverage':ref('Coverage'),'tool_calls':N,'tool_errors':N})
S['Span']=obj({'id':ID,'session_id':ID,'trace_id':{'type':'string','pattern':'^[0-9a-f]{32}$'},'span_id':{'type':'string','pattern':'^[0-9a-f]{16}$'},'parent_span_id':nullable(st(16)),'kind':enum('chat','tool','agent'),'started_at':DT,'ended_at':DT,'model_id':nullable(st(150)),'tool_name':nullable(st(150)),'error_class':nullable(st(100))})
S['Link']=obj({'id':ID,'from_kind':enum('session','commit','pr','deployment','incident'),'from_id':ID,'to_kind':enum('commit','pr','deployment','incident'),'to_id':ID,'status':enum('candidate','verified','rejected','superseded'),'method':st(100),'source_revision_ids':arr(ID),'reason':st(1000),'version':N})
S['LinkDecision']=obj({'decision':enum('verified','rejected'),'reason':st(1000),'source_revision_ids':arr(ID,1)})
S['AllocationRow']=obj({'pr_id':nullable(ID),'weight_ppm':{'type':'integer','minimum':0,'maximum':1000000},'amount_usd':MONEY})
S['AllocationCreate']=obj({'cost_estimate_id':ID,'method':enum('single_verified_pr','analyst_weights'),'source_link_ids':arr(ID),'rows':arr(obj({'pr_id':nullable(ID),'weight_ppm':{'type':'integer','minimum':0,'maximum':1000000}}),1),'reason':st(1000)})
S['Allocation']=obj({'id':ID,'cost_estimate_id':ID,'total_usd':MONEY,'rows':arr(ref('AllocationRow'),1),'method_version':st(50),'source_link_ids':arr(ID),'created_at':DT})
S['CostSummary']=obj({'basis':enum('estimated_equivalent','billed_allocation','subscription_allocation'),'currency':{'const':'USD'},'known_total_usd':MONEY,'allocated_usd':MONEY,'unallocated_usd':MONEY,'unpriced_units':N,'availability':enum('available','partial','unavailable'),'price_versions':arr(st(100)),'coverage':ref('Coverage')})
S['PriceEntry']=obj({'model_id':st(150),'currency':{'const':'USD'},'effective_from':DT,'unit_size':{'type':'integer','minimum':1},'input_usd':MONEY,'output_usd':MONEY,'cache_read_usd':nullable(MONEY),'cache_write_usd':nullable(MONEY),'input_includes_cache':BOOL})
S['PriceCatalogCreate']=obj({'catalog':st(100),'version':st(60),'entries':arr(ref('PriceEntry'),1),'source_url':URI})
S['PriceCatalog']=obj({'id':ID,**S['PriceCatalogCreate']['properties'],'digest':DIGEST})
S['SnapshotCreate']=obj({'scope':ref('Scope'),'window':ref('Window'),'report_definition_id':nullable(ID),'allow_partial':BOOL})
S['Snapshot']=obj({'id':ID,'workspace_id':ID,'state':enum('building','ready','partial','failed','revoked','deleted'),'scope':ref('Scope'),'window':ref('Window'),'created_at':DT,'manifest_digest':nullable(DIGEST),'metric_count':N,'coverage':ref('Coverage')})
S['ReportDefinitionWrite']=obj({'name':st(120),'scope':ref('Scope'),'window_rule':enum('previous_7_days','previous_calendar_month','previous_30_days'),'view':enum('leadership','investigation','coverage')})
S['ReportDefinition']=obj({'id':ID,**S['ReportDefinitionWrite']['properties'],'version':N})
S['ScheduleWrite']=obj({'frequency':enum('daily','weekly','monthly'),'local_time':{'type':'string','pattern':'^([01][0-9]|2[0-3]):[0-5][0-9]$'},'weekday':nullable({'type':'integer','minimum':1,'maximum':7}),'timezone':st(100),'enabled':BOOL})
S['Schedule']=obj({'id':ID,'report_definition_id':ID,**S['ScheduleWrite']['properties'],'next_run_at':nullable(DT),'version':N})
S['ExportCreate']=obj({'snapshot_id':ID,'format':enum('html','json','csv_bundle','markdown')})
S['Export']=obj({'id':ID,'snapshot_id':ID,'format':st(50),'state':enum('queued','building','ready','failed','revoked','expired'),'manifest_digest':nullable(DIGEST),'expires_at':DT,'download_path':nullable(st(500))})
S['InvestigationCreate']=obj({'snapshot_id':ID,'finding_id':st(150),'title':st(200),'owner_user_id':nullable(ID),'due_at':nullable(DT)})
S['InvestigationUpdate']=obj({'status':enum('open','in_progress','resolved','dismissed'),'reason':st(2000),'owner_user_id':nullable(ID),'due_at':nullable(DT)})
S['Investigation']=obj({'id':ID,**S['InvestigationCreate']['properties'],'status':enum('open','in_progress','resolved','dismissed'),'resolution':nullable(st(2000)),'version':N})
S['CommentCreate']=obj({'text':st(4000)})
S['Comment']=obj({'id':ID,'investigation_id':ID,'author_id':ID,'text':st(4000),'created_at':DT})
S['RetentionWrite']=obj({'spans_days':{'type':'integer','minimum':7,'maximum':90},'evidence_days':{'type':'integer','minimum':30,'maximum':730},'exports_days':{'type':'integer','minimum':1,'maximum':90},'audit_days':{'type':'integer','minimum':90,'maximum':730}})
S['Retention']=obj({**S['RetentionWrite']['properties'],'version':N})
S['DeletionCreate']=obj({'project_id':ID,'confirmation_name':st(120),'reason':st(1000)})
S['Deletion']=obj({'id':ID,'project_id':ID,'state':enum('queued','fencing','purging','completed','retrying','failed'),'requested_at':DT,'completed_at':nullable(DT)})
S['Health']=obj({'state':enum('healthy','degraded','unavailable'),'queue_age_seconds':N,'ingestion_lag_seconds':N,'active_jobs':N,'failed_jobs_24h':N,'last_success_at':nullable(DT)})
S['Limits']=obj({'repositories_limit':N,'repositories_used':N,'daily_spans_limit':N,'daily_spans_used':N,'reset_at':DT,'export_bytes_limit':N})
S['Audit']=obj({'id':ID,'actor_id':nullable(ID),'action':st(100),'resource_id':ID,'result':st(100),'occurred_at':DT})
S['DeploymentCreate']=obj({'connector_id':ID,'external_id':st(200),'repository_id':ID,'revision_sha':SHA,'environment':enum('production','staging','development'),'service_key':st(200),'status':enum('in_progress','succeeded','failed','canceled'),'started_at':DT,'completed_at':nullable(DT)})
S['Deployment']=obj({'id':ID,**S['DeploymentCreate']['properties'],'source_revision_id':ID})
S['IncidentCreate']=obj({'connector_id':ID,'external_id':st(200),'service_key':st(200),'severity':enum('critical','high','medium','low'),'impact_started_at':nullable(DT),'detected_at':DT,'recovered_at':nullable(DT),'deployment_ids':arr(ID),'link_status':enum('candidate','verified')})
S['Incident']=obj({'id':ID,**S['IncidentCreate']['properties'],'source_revision_id':ID})
S['ComparisonCreate']=obj({'scope':ref('Scope'),'baseline':ref('Window'),'comparison':ref('Window'),'metric_ids':arr(st(150),1),'maturity_days':{'type':'integer','minimum':0,'maximum':90}})
S['Comparison']=obj({'id':ID,'baseline_snapshot_id':ID,'comparison_snapshot_id':ID,'limitations':arr(st(1000),1),'maturity_days':N})
S['PolicyRule']={'oneOf':[
 obj({'kind':{'const':'required_checks'},'checks':{'type':'array','minItems':1,'maxItems':20,'items':obj({'name':st(200),'producer_app_id':st(100)})}}),
 obj({'kind':{'const':'minimum_approvals'},'count':{'type':'integer','minimum':1,'maximum':5}}),
 obj({'kind':{'const':'no_changes_requested'}}),obj({'kind':{'const':'pr_ready'}}),
 obj({'kind':{'const':'max_changed_lines'},'maximum':{'type':'integer','minimum':1,'maximum':100000}}),
 obj({'kind':{'const':'max_evidence_age'},'seconds':{'type':'integer','minimum':30,'maximum':300}}),
 obj({'kind':{'const':'collection_complete'},'capabilities':arr(st(100),1)})]}
S['PolicyCreate']=obj({'name':st(120),'repository_ids':arr(ID,1),'rules':{'type':'array','items':ref('PolicyRule'),'minItems':1,'maxItems':20},'action_allowlist':arr(enum('publish_check','merge_pr')),'max_evidence_age_seconds':{'type':'integer','minimum':30,'maximum':300},'base_branches':arr(st(250),1),'merge_method':enum('squash','merge','rebase')})
S['Policy']=obj({'id':ID,**S['PolicyCreate']['properties'],'version':N,'mode':enum('draft','shadow','active','disabled')})
S['PolicyMode']=obj({'mode':enum('shadow','active','disabled'),'shadow_report_id':nullable(ID),'reason':st(1000),'confirmed':BOOL})
S['EvaluateCreate']=obj({'policy_id':ID,'repository_id':ID,'pr_number':{'type':'integer','minimum':1},'head_sha':SHA,'snapshot_id':ID})
S['Evaluation']=obj({'id':ID,**S['EvaluateCreate']['properties'],'result':enum('pass','fail','unknown'),'rule_results':arr(obj({'kind':st(100),'result':enum('pass','fail','unknown'),'reason':st(1000)})),'evaluated_at':DT,'expires_at':DT})
S['ActionCreate']=obj({'evaluation_id':ID,'type':enum('publish_check','merge_pr'),'expected_head_sha':SHA,'reason':st(1000)})
S['Action']=obj({'id':ID,**S['ActionCreate']['properties'],'state':enum('pending_approval','queued','executing','succeeded','refused','failed','unknown','cancelled'),'host_result_ref':nullable(st(500)),'version':N})
S['ActionDecision']=obj({'decision':enum('approve','reject'),'reason':st(1000),'confirmed':BOOL})
S['PublicProfile']=obj({'id':ID,'owner':st(100),'name':st(100),'description':{'type':'string','maxLength':1000},'stars':N,'topics':arr(st(100)),'license':nullable(st(100)),'lifecycle':enum('active','archived','removed','private'),'refreshed_at':DT,'provenance':arr(obj({'field':st(100),'source':URI,'kind':enum('observed','reconstructed','generated'),'observed_at':DT}))})
S['PublicRequest']=obj({'repository_url':URI,'reason':st(1000),'publish_issue_confirmed':BOOL})
S['PublicRequestResult']=obj({'id':ID,'state':enum('queued','declined','completed'),'external_issue_url':nullable(URI)})
S['SourceEvidence']=obj({'id':ID,'kind':st(80),'external_id':st(200),'revision':st(200),'occurred_at':nullable(DT),'observed_at':DT,'source_url':nullable(URI),'digest':DIGEST,'safe_summary':st(2000)})
S['Finding']=obj({'id':st(150),'severity':enum('info','investigate','attention'),'title':st(200),'metric_result_id':ID,'recommended_investigation':st(1000),'limitations':arr(st(1000))})
S['Event']=obj({'schema_version':{'const':'1.0'},'event_id':ID,'event_type':enum('source.accepted','source.rejected','collection.completed','session.updated','link.adjudicated','allocation.created','snapshot.published','export.ready','investigation.changed','connector.revoked','deletion.completed','deployment.recorded','incident.recorded','policy.evaluated','action.reconciled'),'workspace_id':ID,'project_id':nullable(ID),'aggregate_id':ID,'aggregate_version':N,'occurred_at':DT,'recorded_at':DT,'correlation_id':ID,'payload':obj({'resource_id':ID,'state':st(100),'count':N})})
S['Manifest']=obj({'schema_version':{'const':'1.0'},'snapshot_id':ID,'scope':ref('Scope'),'window':ref('Window'),'canonical_digest':DIGEST,'metric_versions':{'type':'object','additionalProperties':st(30)},'source_revision_ids':arr(ID),'allocation_version_ids':arr(ID),'privacy_version':st(30),'files':arr(obj({'path':st(300),'sha256':DIGEST,'bytes':N}),1),'generated_at':DT,'limitations':arr(st(1000))})
S['InboxItem']=obj({'id':ID,'kind':enum('report_ready','report_failed','investigation_assigned','action_attention'),'resource_id':ID,'created_at':DT,'read':BOOL,'version':N})
S['InboxUpdate']=obj({'read':BOOL})
S['ShadowReportCreate']=obj({'policy_id':ID,'window':ref('Window')})
S['ShadowAdjudication']=obj({'evaluation_id':ID,'verdict':enum('correct','false_pass','false_fail','unresolved'),'evidence_ids':arr(ID,1),'reason':st(1000)})
S['ShadowReport']=obj({'id':ID,'policy_id':ID,'window':ref('Window'),'repositories':arr(obj({'repository_id':ID,'distinct_heads':N,'consecutive_days':N,'passes':N,'failures':N,'unknowns':N,'unresolved_false_passes':N,'all_passes_reviewed':BOOL,'seeded_safety_tests_passed':BOOL,'qualified':BOOL}),1),'created_at':DT,'digest':DIGEST})
S['ActionControlWrite']=obj({'enabled':BOOL,'reason':st(1000),'confirmed':BOOL})
S['ActionControl']=obj({'enabled':BOOL,'epoch':N,'version':N})
S['BillingCreate']=obj({'basis':enum('billed_allocation','subscription_allocation'),'window':ref('Window'),'total_usd':MONEY,'evidence_id':ID,'rows':arr(obj({'project_id':nullable(ID),'amount_usd':MONEY}),1),'reason':st(1000)})
S['BillingAllocation']=obj({'id':ID,**S['BillingCreate']['properties'],'created_at':DT})
# REST response schemas deliberately have explicit typed list envelopes.
def listref(name):
 key=name+'List'
 if key not in S:S[key]=obj({'items':arr(ref(name)),'next_cursor':nullable(st(2000)),'as_of':DT})
 return key
O={'openapi':'3.1.1','info':{'title':'Sovix Evidence API','version':'1.0.0','description':'Design contract, not a running API. Semantics and authorization: contracts/README.md and security.md. API responses are typed resources; collections are cursor envelopes. All private resource checks are server-side.'},'servers':[{'url':'http://127.0.0.1:8000','description':'Planned local profile; requires local bearer secret'}],'security':[{'BearerAuth':[]}],'paths':{},'components':{'schemas':S,'securitySchemes':{'BearerAuth':{'type':'http','scheme':'bearer','bearerFormat':'JWT or local secret'},'CollectorToken':{'type':'http','scheme':'bearer','description':'Ingest-only scoped collector credential'},'GitHubSignature':{'type':'apiKey','in':'header','name':'X-Hub-Signature-256','description':'HMAC-SHA256 over original request bytes; not a static API key'}}}}
W='/v1/workspaces/{workspace_id}'
ops=[]
def op(path,method,oid,summary,output=None,body=None,status='200',roles='owner,admin,analyst,viewer',story='US2',paginate=False,etag=False,security=None):
 params=[]
 import re
 for p in re.findall(r'{([^}]+)}',path):params.append({'name':p,'in':'path','required':True,'schema':st(150) if p=='metric_id' else ID})
 if paginate:params += [{'name':'limit','in':'query','schema':{'type':'integer','minimum':1,'maximum':100,'default':50}},{'name':'cursor','in':'query','schema':st(2000)}]
 if method=='post':params.append({'name':'Idempotency-Key','in':'header','required':True,'schema':st(200)})
 if etag:params.append({'name':'If-Match','in':'header','required':True,'schema':st(100)})
 responses={status:{'description':'Accepted; poll the returned job.' if status=='202' else 'Successful operation'}}
 if output:responses[status]['content']={'application/json':{'schema':ref(listref(output) if paginate else output)}}
 if method=='get' and not paginate:responses[status]['headers']={'ETag':{'schema':st(100),'description':'Strong resource revision tag'}}
 for c in ['400','401','403','404','409','412','413','422','428','429','503']:
  responses[c]={'description':{'400':'Malformed request','401':'Missing/invalid authentication','403':'Forbidden in known scope','404':'Absent or inaccessible resource','409':'State/idempotency conflict','412':'Stale revision','413':'Payload too large','422':'Domain validation failed','428':'Required precondition missing','429':'Quota/rate limit','503':'Temporarily unavailable'}[c],'content':{'application/problem+json':{'schema':ref('Problem')}}}
 responses['429']['headers']={'Retry-After':{'schema':{'type':'integer','minimum':1}}}
 d={'operationId':oid,'summary':summary,'tags':[story],'x-story':story,'x-roles':roles.split(','),'parameters':params,'responses':responses}
 if body:d['requestBody']={'required':True,'content':{'application/json':{'schema':ref(body)}}}
 if security is not None:d['security']=security
 O['paths'].setdefault(path,{})[method]=d;ops.append((oid,method.upper(),path,story,roles))
op('/v1/me','get','getIdentity','Current authenticated principal','Identity',story='US3')
op('/v1/workspaces','get','listWorkspaces','List permitted workspaces','Workspace',paginate=True,story='US3')
op('/v1/workspaces','post','createWorkspace','Create workspace and owner membership','Workspace','WorkspaceCreate','201',story='US3')
op(W,'get','getWorkspace','Read workspace','Workspace',story='US3')
op(W+'/projects','get','listProjects','List permitted projects','Project',paginate=True,story='US3')
op(W+'/projects','post','createProject','Create project','Project','ProjectCreate','201',roles='owner,admin',story='US3')
op(W+'/projects/{project_id}','get','getProject','Read project','Project',story='US3')
op(W+'/projects/{project_id}','patch','updateProject','Update project metadata','Project','ProjectCreate',roles='owner,admin',story='US3',etag=True)
op(W+'/memberships','get','listMemberships','List workspace memberships','Membership',paginate=True,roles='owner,admin',story='US3')
op(W+'/memberships','post','createMembership','Grant existing authenticated user membership','Membership','MembershipWrite','201',roles='owner,admin',story='US3')
op(W+'/memberships/{membership_id}','patch','updateMembership','Change role/grants; last owner protected','Membership','MembershipWrite',roles='owner,admin',story='US3',etag=True)
op(W+'/memberships/{membership_id}','delete','revokeMembership','Revoke membership; last owner protected',status='204',roles='owner,admin',story='US3',etag=True)
op(W+'/repositories','get','listRepositories','List authorized repositories','Repository',paginate=True,story='US1')
op(W+'/repositories/{repository_id}/projects','put','mapRepositoryProjects','Set repository project mappings','Repository','RepositoryMapping',roles='owner,admin',story='US3',etag=True)
op(W+'/connectors','get','listConnectors','List redacted connector health','Connector',paginate=True,roles='owner,admin,analyst',story='US1')
op(W+'/connectors','post','createConnector','Register source connection','Connector','ConnectorCreate','201',roles='owner,admin',story='US3')
op(W+'/connectors/{connector_id}','get','getConnector','Read health and permissions','Connector',roles='owner,admin,analyst',story='US7')
op(W+'/connectors/{connector_id}','patch','updateConnector','Replace redacted configuration and credential reference','Connector','ConnectorCreate',roles='owner,admin',story='US3',etag=True)
op(W+'/connectors/{connector_id}/revoke','post','revokeConnector','Stop source collection','Connector','Reason',roles='owner,admin',story='US3',etag=True)
op(W+'/connectors/{connector_id}/sync','post','syncConnector','Queue incremental source collection','Job','SyncRequest','202',roles='owner,admin,analyst',story='US1')
op(W+'/imports','post','createImport','Import validated legacy JSON report','Job','ImportRequest','202',roles='owner,admin,analyst',story='US1')
op(W+'/jobs/{job_id}','get','getJob','Read scoped job progress','Job',story='US7')
op(W+'/jobs/{job_id}/cancel','post','cancelJob','Request cooperative cancellation','Job','Reason','202',roles='owner,admin,analyst',story='US7')
op(W+'/collectors','get','listCollectors','List collector capabilities','Collector',paginate=True,roles='owner,admin',story='US4')
op(W+'/collectors','post','createCollector','Issue scoped ingestion credential once','CollectorSecret','CollectorCreate','201',roles='owner,admin',story='US4')
op(W+'/collectors/{collector_id}/revoke','post','revokeCollector','Revoke ingestion credential','Collector','Reason',roles='owner,admin',story='US4')
op(W+'/sessions','get','listSessions','List metadata-only observed sessions','Session',paginate=True,roles='owner,admin,analyst',story='US4')
op(W+'/sessions/{session_id}','get','getSession','Read session metadata','Session',roles='owner,admin,analyst',story='US4')
op(W+'/sessions/{session_id}/spans','get','listSessionSpans','Read metadata-only spans','Span',paginate=True,roles='owner,admin,analyst',story='US4')
op(W+'/links','get','listLinks','List evidence associations','Link',paginate=True,roles='owner,admin,analyst',story='US5')
op(W+'/links/{link_id}/decision','post','adjudicateLink','Append verified or rejected link revision','Link','LinkDecision','201',roles='owner,admin,analyst',story='US5',etag=True)
op(W+'/allocations','post','createAllocation','Append conserving allocation version','Allocation','AllocationCreate','201',roles='owner,admin,analyst',story='US5')
op(W+'/allocations/{allocation_id}','get','getAllocation','Read allocation provenance','Allocation',roles='owner,admin,analyst',story='US5')
op(W+'/prices','get','listPrices','Read versioned rate catalogs','PriceCatalog',paginate=True,story='US5')
op(W+'/prices','post','createPrices','Import immutable USD rate catalog','PriceCatalog','PriceCatalogCreate','201',roles='owner,admin',story='US5')
op(W+'/snapshots','post','createSnapshot','Build version-pinned report snapshot','Job','SnapshotCreate','202',roles='owner,admin,analyst',story='US2')
op(W+'/snapshots','get','listSnapshots','List permitted snapshots','Snapshot',paginate=True,story='US2')
op(W+'/snapshots/{snapshot_id}','get','getSnapshot','Read snapshot manifest metadata','Snapshot',story='US2')
op(W+'/snapshots/{snapshot_id}/metrics','get','listMetrics','Read evidence-bearing metrics','MetricResult',paginate=True,story='US2')
op(W+'/snapshots/{snapshot_id}/metrics/{metric_id}','get','getMetric','Verify one metric calculation','MetricResult',story='US2')
op(W+'/snapshots/{snapshot_id}/findings','get','listFindings','Read bounded rule-selected findings','Finding',paginate=True,story='US2')
op(W+'/snapshots/{snapshot_id}/costs','get','getSnapshotCosts','Read pinned estimate and unknown buckets','CostSummary',story='US5')
op(W+'/evidence/{evidence_id}','get','getEvidence','Read sanitized currently authorized evidence','SourceEvidence',story='US2')
op(W+'/report-definitions','post','createReportDefinition','Save report scope/window/view','ReportDefinition','ReportDefinitionWrite','201',roles='owner,admin,analyst',story='US6')
op(W+'/report-definitions','get','listReportDefinitions','List permitted saved reports','ReportDefinition',paginate=True,story='US6')
op(W+'/report-definitions/{report_definition_id}','patch','updateReportDefinition','Change saved report','ReportDefinition','ReportDefinitionWrite',roles='owner,admin,analyst',story='US6',etag=True)
op(W+'/report-definitions/{report_definition_id}/schedule','put','upsertSchedule','Configure one report schedule','Schedule','ScheduleWrite',roles='owner,admin,analyst',story='US6',etag=True)
op(W+'/report-definitions/{report_definition_id}/schedule','get','getSchedule','Read schedule/next occurrence','Schedule',story='US6')
op(W+'/exports','post','createExport','Generate authorized offline artifact','Job','ExportCreate','202',roles='owner,admin,analyst',story='US2')
op(W+'/exports/{export_id}','get','getExport','Read export lifecycle','Export',story='US6')
op(W+'/exports/{export_id}/download','get','downloadExport','Download after fresh authorization',story='US6')
O['paths'][W+'/exports/{export_id}/download']['get']['responses']['200']['content']={'application/octet-stream':{'schema':{'type':'string','format':'binary'}}}
op(W+'/investigations','get','listInvestigations','List scoped investigations','Investigation',paginate=True,story='US6')
op(W+'/investigations','post','createInvestigation','Record finding follow-up','Investigation','InvestigationCreate','201',roles='owner,admin,analyst',story='US6')
op(W+'/investigations/{investigation_id}','patch','updateInvestigation','Transition investigation with reason','Investigation','InvestigationUpdate',roles='owner,admin,analyst',story='US6',etag=True)
op(W+'/investigations/{investigation_id}/comments','post','createInvestigationComment','Append safe comment','Comment','CommentCreate','201',roles='owner,admin,analyst',story='US6')
op(W+'/retention','get','getRetention','Read retention settings','Retention',roles='owner,admin',story='US7')
op(W+'/retention','put','updateRetention','Set bounded retention','Retention','RetentionWrite',roles='owner,admin',story='US7',etag=True)
op(W+'/deletion-requests','post','createDeletion','Fence and purge a confirmed project','Job','DeletionCreate','202',roles='owner,admin',story='US7')
op(W+'/deletion-requests/{deletion_id}','get','getDeletion','Read deletion progress','Deletion',roles='owner,admin',story='US7')
op(W+'/health','get','getWorkspaceHealth','Read payload-free operational health','Health',roles='owner,admin',story='US7')
op(W+'/limits','get','getWorkspaceLimits','Read configured entitlements/usage','Limits',roles='owner,admin',story='US7')
op(W+'/audit','get','listAudit','Read content-free access/action history','Audit',paginate=True,roles='owner,admin',story='US3')
op(W+'/deployments','post','recordDeployment','Record explicit deployment evidence','Job','DeploymentCreate','202',roles='owner,admin',story='US8')
op(W+'/deployments','get','listDeployments','Read deployment source records','Deployment',paginate=True,story='US8')
op(W+'/incidents','post','recordIncident','Record explicit incident evidence','Job','IncidentCreate','202',roles='owner,admin',story='US8')
op(W+'/incidents','get','listIncidents','Read incident source records','Incident',paginate=True,story='US8')
op(W+'/comparisons','post','createComparison','Build maturity-aware cohort comparison','Job','ComparisonCreate','202',roles='owner,admin,analyst',story='US8')
op(W+'/comparisons/{comparison_id}','get','getComparison','Read pinned comparison','Comparison',story='US8')
op(W+'/policies','post','createPolicy','Create a draft immutable policy version','Policy','PolicyCreate','201',roles='owner,admin',story='US9')
op(W+'/policies','get','listPolicies','Read scoped policy versions','Policy',paginate=True,roles='owner,admin,analyst',story='US9')
op(W+'/policies/{policy_id}','get','getPolicy','Read policy version','Policy',roles='owner,admin,analyst',story='US9')
op(W+'/policies/{policy_id}/mode','post','setPolicyMode','Explicitly transition shadow/active/disabled','Policy','PolicyMode',roles='owner,admin',story='US9',etag=True)
op(W+'/evaluations','post','evaluatePolicy','Evaluate exact PR head','Job','EvaluateCreate','202',roles='owner,admin,analyst',story='US9')
op(W+'/evaluations/{evaluation_id}','get','getEvaluation','Read tri-state evaluation','Evaluation',roles='owner,admin,analyst',story='US9')
op(W+'/actions','post','proposeAction','Propose allowlisted action without executing','Action','ActionCreate','201',roles='owner,admin',story='US9')
op(W+'/actions/{action_id}','get','getAction','Read action and reconciliation state','Action',roles='owner,admin,analyst',story='US9')
op(W+'/actions/{action_id}/decision','post','decideAction','Approve or reject explicit action','Action','ActionDecision',roles='owner,admin',story='US9',etag=True)
op('/v1/public/repositories','get','listPublicRepositories','Search public-only profiles','PublicProfile',paginate=True,roles='public',story='US10',security=[])
op('/v1/public/repositories/{repository_id}','get','getPublicRepository','Read public-only profile','PublicProfile',roles='public',story='US10',security=[])
op('/v1/public/requests','post','requestPublicRepository','Preview-confirmed external issue request','PublicRequestResult','PublicRequest','202',roles='authenticated',story='US10')
op(W+'/snapshots/{snapshot_id}/manifest','get','getSnapshotManifest','Read content-hash manifest and pinned versions','Manifest',story='US2')
op(W+'/report-definitions/{report_definition_id}','get','getReportDefinition','Read report definition and parent schedule ETag','ReportDefinition',story='US6')
op(W+'/investigations/{investigation_id}','get','getInvestigation','Read investigation and current revision','Investigation',story='US6')
op(W+'/investigations/{investigation_id}/comments','get','listInvestigationComments','Read safe investigation comments','Comment',paginate=True,story='US6')
op(W+'/links/{link_id}','get','getLink','Read association and current revision','Link',roles='owner,admin,analyst',story='US5')
op(W+'/repositories/{repository_id}','get','getRepository','Read repository mapping and revision','Repository',story='US3')
op(W+'/memberships/{membership_id}','get','getMembership','Read membership and current revision','Membership',roles='owner,admin',story='US3')
op(W+'/inbox','get','listInbox','List current principal in-product notifications','InboxItem',paginate=True,story='US6')
op(W+'/inbox/{inbox_item_id}','get','getInboxItem','Read own notification revision','InboxItem',story='US6')
op(W+'/inbox/{inbox_item_id}','patch','updateInbox','Mark own notification read','InboxItem','InboxUpdate',story='US6',etag=True)
op(W+'/shadow-adjudications','post','adjudicateShadowEvaluation','Record admin judgment against exact evaluation','ShadowAdjudication','ShadowAdjudication','201',roles='owner,admin',story='US9')
op(W+'/shadow-reports','post','createShadowReport','Build qualification report from reviewed shadow evaluations','Job','ShadowReportCreate','202',roles='owner,admin',story='US9')
op(W+'/shadow-reports/{shadow_report_id}','get','getShadowReport','Read pinned qualification results','ShadowReport',roles='owner,admin,analyst',story='US9')
op(W+'/action-control','get','getActionControl','Read workspace action kill-switch epoch','ActionControl',roles='owner,admin',story='US9')
op(W+'/action-control','put','setActionControl','Explicitly enable or disable workspace host actions','ActionControl','ActionControlWrite',roles='owner,admin',story='US9',etag=True)
op(W+'/billing-allocations','post','createBillingAllocation','Record separate evidence-backed billing allocation','BillingAllocation','BillingCreate','201',roles='owner,admin',story='US5')
op(W+'/billing-allocations','get','listBillingAllocations','Read financial bases separately from estimates','BillingAllocation',paginate=True,roles='owner,admin,analyst',story='US5')
O['paths'][W+'/report-definitions/{report_definition_id}/schedule']['put']['description']='If-Match is the parent ReportDefinition ETag on both create and update. Transaction bumps parent revision and schedule version; fetch parent again after mutation.'
# Explicit filtering contract on list endpoints; private scope selection remains authorization-bound.
for path,methods in O['paths'].items():
 if 'get' not in methods:continue
 d=methods['get']
 if any(p['name']=='cursor' for p in d['parameters']):
  if '/public/' in path:
   for name in ['q','topic','language']:d['parameters'].append({'name':name,'in':'query','schema':st(200)})
  else:
   for name,sc in [('project_id',ID),('repository_id',ID),('start',DT),('end',DT)]:d['parameters'].append({'name':name,'in':'query','schema':sc})
# Non-REST receiver routes retain their native protocol envelopes.
O['paths']['/v1/traces']={'post':{'operationId':'ingestOtlpTraces','summary':'OTLP/HTTP trace intake; native protocol, not a REST job','tags':['US4'],'x-story':'US4','x-roles':['collector'],'security':[{'CollectorToken':[]}],'requestBody':{'required':True,'content':{'application/json':{'schema':{'type':'object','description':'ExportTraceServiceRequest from the pinned opentelemetry-proto contract. JSON follows OTLP JSON encoding, not custom REST encoding.','properties':{'resourceSpans':{'type':'array','items':{'type':'object'}}},'additionalProperties':False}},'application/x-protobuf':{'schema':{'type':'string','format':'binary'}}}},'responses':{'200':{'description':'ExportTraceServiceResponse; partial rejection counts if applicable. Client must not retry partial success.','content':{'application/json':{'schema':obj({'partialSuccess':obj({'rejectedSpans':{'type':'string','pattern':'^[0-9]+$'},'errorMessage':{'type':'string','maxLength':1000}},[])},[])},'application/x-protobuf':{'schema':{'type':'string','format':'binary'}}}},**{str(c):{'description':desc} for c,desc in [(400,'Invalid OTLP payload; no retry'),(401,'Missing/invalid collector token'),(403,'Revoked or wrong-scope collector'),(413,'Decompressed payload too large'),(429,'Retry with Retry-After'),(502,'Retryable gateway error'),(503,'Retryable unavailable receiver'),(504,'Retryable timeout')]}}}}
O['paths']['/webhooks/github']={'post':{'operationId':'receiveGithubWebhook','summary':'Verify raw signature then persist delivery before acknowledgement','tags':['US1'],'x-story':'US1','x-roles':['github'],'security':[{'GitHubSignature':[]}],'parameters':[{'name':'X-GitHub-Delivery','in':'header','required':True,'schema':st(100)},{'name':'X-GitHub-Event','in':'header','required':True,'schema':st(100)}],'requestBody':{'required':True,'content':{'application/json':{'schema':{'type':'object','description':'GitHub event-specific payload validated after raw-byte HMAC; unknown actions acknowledged and safely ignored.'}}}},'responses':{'202':{'description':'Durably received or previously received; internal worker handles retries'},'400':{'description':'Malformed payload'},'401':{'description':'Invalid signature'},'413':{'description':'Payload too large'},'503':{'description':'Cannot durably persist; retry/reconcile required'}}}}
OUT.mkdir(parents=True,exist_ok=True)
(OUT/'openapi.json').write_text(json.dumps(O,indent=2)+'\n')
def standalone(x):
 if isinstance(x,dict):return {k:(v.replace('#/components/schemas/','#/$defs/') if k=='$ref' else standalone(v)) for k,v in x.items()}
 if isinstance(x,list):return [standalone(v) for v in x]
 return x
for fn,root in [('domain.schema.json','MetricResult'),('events.schema.json','Event'),('manifest.schema.json','Manifest')]:
 out={'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'https://schemas.sovix.example/v1/'+fn,'$ref':'#/$defs/'+root,'$defs':standalone(S)}
 (OUT/fn).write_text(json.dumps(out,indent=2)+'\n')
lines=['# API Operation Index','','Generated by `scripts/build_contracts.py`. The OpenAPI contract is [openapi.json](openapi.json).','','| Operation | Method | Path | Story | Roles |','|---|---|---|---|---|']
for oid,method,path,story,roles in ops:lines.append(f'| `{oid}` | {method} | `{path}` | {story} | {roles} |')
lines += ['| `ingestOtlpTraces` | POST | `/v1/traces` | US4 | Collector token |','| `receiveGithubWebhook` | POST | `/webhooks/github` | US1 | GitHub HMAC |','']
(OUT/'operations.md').write_text('\n'.join(lines))
print(f'Generated {len(ops)+2} operations, {len(S)} schemas')
