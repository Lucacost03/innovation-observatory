"""Verify the distributable route, including compressed legacy fixtures."""
from pathlib import Path,PurePosixPath
import json,subprocess,tempfile,zipfile
R=Path(__file__).resolve().parents[1];bundle=R/'dist/data/innovation_observatory_source.zip'
assert bundle.stat().st_size<=25*1024*1024, 'Hosting per-file limit'
with tempfile.TemporaryDirectory(prefix='innovation-source-check-')as temporary:
 with zipfile.ZipFile(bundle)as z:
  assert z.testzip()is None
  for name in z.namelist():assert not PurePosixPath(name).is_absolute()and'..'not in PurePosixPath(name).parts
  z.extractall(temporary)
 root=Path(temporary)/'innovation_observatory'
 subprocess.run(['python3','scripts/unpack_source_fixtures.py'],cwd=root,check=True,capture_output=True)
 for script in ['research/tariffs_1_30/rebuild.py','research/fiscal_latest_1_30/extract.py','research/fiscal_latest_1_30/extract_capital.py','research/participation_1_29/extract.py','research/demography_1_26/extract.py','research/demography_1_26/extract_post_participation.py','research/sovereign_foreign_1_26/check_sources.py']:
  subprocess.run(['python3',script],cwd=root,check=True,capture_output=True,text=True)
 a=subprocess.run(['python3','tests/fiscal-source-audit.py'],cwd=root,check=True,capture_output=True,text=True)
 assert json.loads(a.stdout)['status']=='PASS'
 js="""import fs from'node:fs';import assert from'node:assert/strict';import{Economy,simulate}from'./dist/engine.mjs';import{DEFAULTS}from'./dist/parameters.mjs';const ps=JSON.parse(fs.readFileSync('dist/data/profiles.json'));for(const p of ps){const r=new Economy(p.params,2026).initialSnapshot();assert(Number.isFinite(r.publicTotalRevenue)&&Number.isFinite(r.publicTotalExpenditure));}const generic=simulate({...DEFAULTS,periods:8},2026,{snapshots:false});assert(generic.rows.every(r=>Object.values(r).every(Number.isFinite)));for(const code of['USA','CHN']){const r=simulate({...ps.find(x=>x.code===code).params,periods:8},2026,{snapshots:false});assert(r.rows.every(r=>r.relativeResidual<1e-8&&r.financeResidual<1e-8));}console.log('PASS');"""
 subprocess.run(['node','--input-type=module','-e',js],cwd=root,check=True,capture_output=True,text=True)
 subprocess.run(['node','tests/retirement-pensions.mjs'],cwd=root,check=True,capture_output=True,text=True)
 subprocess.run(['node','tests/tariff-fiscal.mjs'],cwd=root,check=True,capture_output=True,text=True)
 subprocess.run(['node','tests/inference.mjs'],cwd=root,check=True,capture_output=True,text=True)
 subprocess.run(['node','tests/credit-policy.mjs'],cwd=root,check=True,capture_output=True,text=True)
 subprocess.run(['node','tests/participation-import-cost.mjs'],cwd=root,check=True,capture_output=True,text=True)
print(json.dumps({'status':'PASS','archiveBytes':bundle.stat().st_size,'checks':['ZIP integrity and safe member paths','Distributed95% inference and per-capita growth checks','Lossless historical fixture restoration with hashes','Primary fiscal source audit without optional raw BEA workbooks','All30 source opening budgets and unmatched legacy context','USA/China8-year distributed-code accounting simulations','Restored age/participation and external-government source audits']}))
