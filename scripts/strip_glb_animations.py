"""Create a temporary static GLB for thumbnail rendering ONLY.

Do not use the output as a game asset: animations are intentionally omitted.
The original GLB, binary buffer, textures, skin, materials and rig are unmodified.
"""
import json
import struct
import sys
from pathlib import Path

def without_animations(source, target):
    raw=Path(source).read_bytes()
    if len(raw)<20 or raw[:4]!=b'glTF' or struct.unpack_from('<I',raw,4)[0]!=2:
        raise ValueError('Expected glTF binary v2')
    declared=struct.unpack_from('<I',raw,8)[0]
    if declared!=len(raw):
        raise ValueError('GLB size mismatch')
    length, kind=struct.unpack_from('<I4s',raw,12)
    if kind!=b'JSON' or length%4 or length+20>len(raw):
        raise ValueError('Malformed JSON chunk')
    doc=json.loads(raw[20:20+length].decode('utf-8').rstrip('\x00 '))
    removed=len(doc.pop('animations',[]) or [])
    if removed<=0:
        raise ValueError('GLB has no animations to omit')
    encoded=json.dumps(doc,ensure_ascii=False,separators=(',',':')).encode('utf-8')
    encoded+=b' '*((-len(encoded))%4)
    tail=raw[20+length:]
    payload=struct.pack('<4sII',b'glTF',2,20+len(encoded)+len(tail))
    payload+=struct.pack('<I4s',len(encoded),b'JSON')+encoded+tail
    Path(target).write_bytes(payload)
    return removed

if __name__=='__main__':
    count=without_animations(sys.argv[1],sys.argv[2])
    print(f'Created temporary static thumbnail input (omitted {count} animations); original preserved.')
