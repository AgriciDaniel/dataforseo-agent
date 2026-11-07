import re,html,glob,json,os,sys
def clean(s): return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',s))).strip()
rows=[]
for f in sorted(glob.glob(sys.argv[1]+'/*.html')):
    t=open(f).read()
    url='https://dataforseo.com/pricing/'+os.path.basename(f)[:-5].replace('__','/')
    for tb in re.findall(r'<table class="pricing-table__table".*?</table>',t,re.S):
        title=''
        for g in re.findall(r'<tbody class="pricing-table__group">(.*?)</tbody>',tb,re.S):
            name=path=''
            for tr in re.findall(r'<tr>(.*?)</tr>',g,re.S):
                m=re.search(r'pricing-table__name">(.*?)</span>',tr,re.S)
                if m: name=clean(m.group(1))
                m=re.search(r'pricing-table__path">(.*?)</code>',tr,re.S)
                if m: path=clean(m.group(1))
                cells={}
                for lab,body in re.findall(r'<td[^>]*data-label="([^"]+)"[^>]*>(.*?)</td>',tr,re.S):
                    mm=re.findall(r'class="pricing-table__(main|sub)">(.*?)</span>',body,re.S)
                    cells[lab]={k:clean(v) for k,v in mm} if mm else {'main':clean(body)}
                rows.append(dict(page=url,name=name,path=path,cells=cells))
json.dump(rows,open(sys.argv[2],'w'),indent=1)
print(len(rows), len({r['path'] for r in rows}))
for r in rows[:3]: print(r)
import collections; print(collections.Counter(tuple(sorted(r['cells'])) for r in rows))
