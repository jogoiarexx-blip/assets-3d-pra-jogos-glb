"""Regression test: static thumbnail fallback must preserve the complete binary chunk."""
import json
import struct
import tempfile
from pathlib import Path
from strip_glb_animations import without_animations

with tempfile.TemporaryDirectory() as tmp:
    root=Path(tmp)
    source=root/'original.glb'
    dest=root/'thumbnail-only.glb'
    doc={
       'asset':{'version':'2.0'},
       'buffers':[{'byteLength':4}],
       'bufferViews':[{'buffer':0,'byteOffset':0,'byteLength':4}],
       'meshes':[{'primitives':[{'attributes':{'POSITION':0},'indices':1}]}],
       'skins':[{'joints':[0]}],
       'textures':[{'source':0}],
       'images':[{'mimeType':'image/png','bufferView':0}],
       'animations':[{'name':'walk','samplers':[],'channels':[]}],
    }
    encoded=json.dumps(doc).encode()
    encoded+=b' '*((-len(encoded))%4)
    bin_bytes=b'\x01\x02\x03\x04'
    source.write_bytes(struct.pack('<4sII',b'glTF',2,20+len(encoded)+8+len(bin_bytes))+
                      struct.pack('<I4s',len(encoded),b'JSON')+encoded+
                      struct.pack('<I4s',len(bin_bytes),b'BIN\x00')+bin_bytes)
    before=source.read_bytes()
    assert without_animations(source,dest)==1
    assert source.read_bytes()==before
    new=dest.read_bytes()
    assert len(new)==struct.unpack_from('<I',new,8)[0]
    count=struct.unpack_from('<I',new,12)[0]
    updated=json.loads(new[20:20+count].decode().strip())
    assert not updated.get('animations')
    for key in ('skins','textures','images','meshes','bufferViews','buffers'):
       assert updated[key]==doc[key],key
    assert new[20+count:]==before[20+len(encoded):],'binary data changed'
    print('Static preview GLB regression: passed; original, rig and binary data preserved')
