"""Render a GLB into a neutral, textured preview. Read-only source file."""
import sys
from pathlib import Path
import bpy
from mathutils import Vector

arguments = sys.argv[sys.argv.index('--') + 1:]
source, output = map(str, arguments[:2])
scene = bpy.context.scene
# Keep the valid startup scene, but remove its default objects.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=source)
scene.frame_set(0)
meshes = [obj for obj in scene.objects if obj.type == 'MESH' and not obj.hide_render]
if not meshes:
    raise RuntimeError('GLB has no renderable meshes')

points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
mins = Vector(tuple(min(v[i] for v in points) for i in range(3)))
maxs = Vector(tuple(max(v[i] for v in points) for i in range(3)))
center = (mins + maxs) * 0.5
size = maxs - mins
longest = max(size.x, size.y, size.z, 0.2)

scene.render.engine = 'CYCLES'
scene.cycles.samples = 10
scene.render.resolution_x = 360
scene.render.resolution_y = 260
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.film_transparent = False
scene.render.filepath = output
scene.camera = None
scene.render.threads_mode = 'FIXED'
scene.render.threads = 2

world = bpy.data.worlds.new('Neutral studio')
world.use_nodes = True
background = world.node_tree.nodes.get('Background')
background.inputs['Color'].default_value = (0.085, 0.11, 0.16, 1.0)
background.inputs['Strength'].default_value = 0.85
scene.world = world

camera_data = bpy.data.cameras.new('Preview orthographic camera')
camera = bpy.data.objects.new('Preview camera', camera_data)
scene.collection.objects.link(camera)
view = Vector((1.45, -1.85, 1.1)).normalized()
camera.location = center + view * longest * 3.1
camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera_data.type = 'ORTHO'
# GLBs can use very large or very small coordinates; default camera clip_end
# silently renders an empty thumbnail for some perfectly valid models.
camera_data.clip_start = max(0.001, longest * 0.00005)
camera_data.clip_end = max(1000, longest * 50)
camera_data.ortho_scale = max(size.z * 1.9, size.x * 1.6, size.y * 1.6, longest * 1.75, 0.5)
scene.camera = camera

def add_light(name, offset, power, scale):
    lamp = bpy.data.lights.new(name, 'AREA')
    lamp.energy = power
    lamp.shape = 'DISK'
    lamp.size = scale
    obj = bpy.data.objects.new(name, lamp)
    scene.collection.objects.link(obj)
    obj.location = center + Vector(offset) * longest
    obj.rotation_euler = (center - obj.location).to_track_quat('-Z', 'Y').to_euler()

add_light('Soft key', (1.5, -1.9, 2.9), 450 * max(longest, 1) ** 2, longest * 2.3)
add_light('Soft fill', (-2.3, 0.6, 1.8), 225 * max(longest, 1) ** 2, longest * 2.0)
add_light('Rim', (0.3, 2.6, 1.7), 320 * max(longest, 1) ** 2, longest * 1.6)

Path(output).parent.mkdir(parents=True, exist_ok=True)
bpy.ops.render.render(write_still=True)
if not Path(output).is_file():
    raise RuntimeError('Render did not produce the preview PNG')
