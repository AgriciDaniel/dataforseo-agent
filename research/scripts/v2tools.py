import re,glob,json,sys,os
out=[]
for f in sorted(glob.glob(sys.argv[1]+'/src/core/modules/*/tools/**/*.ts',recursive=True)):
    t=open(f).read()
    n=re.search(r"getName\(\)[^{]*\{\s*return\s*['\"]([^'\"]+)",t)
    paths=re.findall(r"makeRequest\(\s*[`'\"]([^`'\"]+)[`'\"]\s*,\s*'(\w+)'",t)
    out.append(dict(tool=n.group(1) if n else None,module=f.split('/modules/')[1].split('/')[0],paths=[{'path':p,'method':m} for p,m in paths]))
json.dump(out,open(sys.argv[2],'w'),indent=1)
print(len(out),sum(1 for o in out if not o['paths']))
for o in out:
  if not o['paths']: print('NOPATH',o['tool'])
