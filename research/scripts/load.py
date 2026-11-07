import yaml
class L(yaml.CSafeLoader): pass
L.yaml_implicit_resolvers={k:[(t,r) for t,r in v if t not in ('tag:yaml.org,2002:timestamp','tag:yaml.org,2002:value')] for k,v in yaml.CSafeLoader.yaml_implicit_resolvers.items()}
def load(f): return yaml.load(open(f),Loader=L)
