# Live renderer comparison verification

2026-11-12. Read-only extraction, not render restoration.

## Native verification

Renderer-only real-scene projections and synthetic fixtures ran in separate headless DAZ4/6 profiles with shared application/UI copying disabled. The user GUI process and scene were not controlled, opened, saved, or changed. This does not prove that every Unknown in an uninspected active session is reproduced.

- Ordinary renderer fixture: DAZ4 177/177 rows Equal, capture58ms; DAZ6 177/177 Equal, capture13ms. These counts include group headings.
- Deliberate Min Samples and Post SSIM Max Memory +1 changes: exactly those two Changed rows, on both versions.
- Layered image/mask/modifier fixture:221/221 render rows Equal on both versions (native round-trip); direct getters avoid flattening or baking textures.
- Populated canvas fixture: DAZ6 28/28 Equal; DAZ4 27Equal and one real LightPathExpression-to-Beauty load conversion correctly Changed. Hardened membership compares unique internal name, node kind and source identity, not labels alone.
- Animated Environment Intensity native export at intermediate frame: current_value2 versus default value1. Read-only projection retains explicit current_value; targeted animation without a snapshot becomes Not recorded. Restore still rejects animated helpers.
- All49 Workbench suites pass with bundle checks. Focused:81 live-render,20 canvas,12 animated-snapshot,5 map-color,10 cache-schema cases. SaveGuard service/UI and6 real cache-producer checks pass. ES3/ES5 and reproducible bundle checks pass.
- Final Workbench bundle SHA256:79146c7d3b03e29e2a2e346d38bca01aa8de859c1c7a61d5fa313d7ef2a46ae4.
- Shared DAZ4/6 UI/settings hashes unchanged. Original three processes preserved. No commits or pushes.

## Coverage

Bounded property groups, element children and alias targets; native property subclasses; existing renderer holders; environment/tone singleton registry; simple HDRI path/gamma; layered texture layers/masks/blending/transforms and modifiers; canvas definitions/selection/node membership; float32 and QColor precision; General settings and nested Photoreal/Interactive controls. Identical serialized blocks deduplicate; conflicting owners remain Unknown. Canvas failures do not hide unrelated renderer properties.

Owned old inspection caches refresh under inspection-projection-render-5-20261112. Unknown/foreign cache schemas are untouched. Nested render rows are validated rather than rejecting the new richer tree.
### DIMENSIONS
- Saved renderer
- Image size (pixels)
- Aspect ratio
- Constrain proportions

### QUALITY / SAMPLES
- Min Samples
- Max Samples
- Max Time
- Rendering Quality Enable
- Rendering Quality
- Rendering Converged Ratio
- Post Denoiser Enable
- Post Denoiser Start Iteration

### ENVIRONMENT / HDRI
- Environment Mode
- Dome Mode
- Draw Dome
- Visualize Finite Dome
- Environment Intensity
- Environment Map
- Environment Map / Image
- Environment Map / Saved image gamma
- Environment Tint
- Environment Lighting Resolution
- Environment Lighting Blur
- Dome Scale Multiplier
- Dome Radius
- Dome Width
- Dome Height
- Dome Depth
- Dome Origin X
- Dome Origin Y
- Dome Origin Z
- Dome Orientation X
- Dome Orientation Y
- Dome Orientation Z
- Dome Rotation
- SS Latitude
- SS Longitude
- SS Day
- SS Time
- SS UTC Offset
- SS Sun Disk Intensity
- SS Sun Disk Scale
- SS Sun Glow Intensity
- SS Physically Scaled Sun
- SS Haze
- SS Blue-Red Tint
- SS Saturation
- SS Horizon Height
- SS Horizon Blur
- SS Night Color
- SS Multiplier
- SS RGB Unit Conversion
- SS Ground Color
- Ground Texture Scale
- Ground Position Mode
- Ground Origin X
- Ground Origin Y
- Ground Origin Z
- Draw Ground
- Ground Reflectivity
- Ground Glossiness
- Ground Shadow Intensity
- Ground Visible from Below
- Matte Fog
- Matte Fog Visibility
- Matte Fog Visibility Tint
- Matte Fog Brightness
- Matte Fog Brightness Relative to Environment
- Matte Fog Brightness Tint
- Ground Fog
- Ground Fog Albedo
- Ground Fog Decay Start
- Ground Fog Density Start Scale
- Ground Fog Density Start
- Ground Fog Decay Height
- Ground Fog Density End Scale
- Ground Fog Density End
- Ground Fog Scattering Type
- Ground Fog Anisotropy
- Ground Fog Particle Size

### TONE MAPPING
- Tone Mapping Enable
- Exposure Value
- Shutter Speed
- Aperture
- Film ISO
- cm2 Factor
- Vignetting
- White Point Scale
- White Point
- Burn Highlights Per Component
- Burn Highlights
- Crush Blacks
- Saturation
- Gamma

### ADDITIONAL RENDER SETTINGS

### General Render
- Auto Headlamp
- Post Process Script

### NVIDIA Iray Render Options
- Render Mode
- Rendering Quality SSIM
- Progressive Aux Canvas
- Post SSIM Available
- Post SSIM Enable
- Post SSIM Predict Target
- Post SSIM Max Memory
- Pixel Filter
- Pixel Filter Radius
- Post Denoiser Available
- Post Denoiser Max Memory
- Post Denoiser Denoise Alpha
- White Mode Enable
- White Mode Color
- White Mode BSDF Weight
- Section Caps Enabled
- Section Caps Color
- Active Canvas

### NVIDIA Iray Photoreal Options
- Min Update Samples
- Update Interval
- Default Alpha LPE
- Custom Alpha LPE
- Max Path Length
- Max SSS Path Length
- Caustic Sampler
- Guided Sampling
- Instancing Optimization
- Ray Tracing Low Memory
- Texture Compression
- Texture Compression Medium Threshold
- Texture Compression High Threshold
- Firefly Filter Enable
- Nominal Luminance
- Noise Degrain Filtering
- Noise Degrain Radius
- Noise Degrain Blur Difference
- Bloom Filter Enable
- Bloom Filter Radius
- Bloom Filter Threshold
- Bloom Filter Brightness Scale
- Spectral Rendering Enable
- Spectral Conversion Color Space
- Spectral Conversion Intent
- Spectral Observer

### NVIDIA Iray Interactive Options
- Occlusion Mode
- Ambient Intensity
- Ambient Falloff Min Distance
- Ambient Falloff Max Distance
- Ambient Falloff
- Ambient Falloff Distance Space
- Indirect Light Mode
- Indirect Outlier Rejection
- Ambient Shadow Mode
- Shadows
- IBL Falloff
- Refinement Mode
- Max Ray Bounces
- Max Reflection Bounces
- Max Refraction Bounces
- Ray Importance Threshold
- First Frame Antialiasing
- Area As Point Lights
- Environment Max Resolution
- Path Space Filtering (PSF)
- PSF Geometry Filter
- PSF Lighting Filter
- PSF Convergence Frame

## Verified limitations and unresolved data

- Truly absent Environment/Tonemapper singleton nodes have no current values to read. Native Scene.findSingletonNode(UUID-string) returns null on empty scenes and existing nodes on loaded fixtures. Detached constructors expose defaults, not active scene state, and may omit maps. No creation/apply/render is performed merely to compare.
- Saved data omitted by the serializer cannot be compared honestly. Native PostToon edgeColor2/shadeColor were not serialized even when assigned; only the ten persisted canvas fields are compared.
- Animated targeted channels without explicit current_value remain Not recorded; reconstructing interpolation is deliberately not guessed.
- Unresolved external image definitions, malformed/duplicate IDs, missing image size/source, unknown future layer attributes, broken aliases and ambiguous owner/member identities stay Unknown. These are conservative unsupported inputs, not a claim that all such data are impossible through DAZ APIs.
- Arbitrary third-party renderer/plugin schemas outside General/Iray have not been enumerated. No blanket API-impossibility claim is made.
- Asset-source path identity follows this Windows deployment's case-insensitive paths. This was not tested on case-sensitive platforms.

## Primary references

- https://docs.daz3d.com/public/software/dazstudio/4/referenceguide/scripting/api_reference/samples/rendering/render_settings_find_property/start
- https://docs.daz3d.com/public/software/dazstudio/4/referenceguide/scripting/api_reference/object_index/irayrenderer_dz
- https://docs.daz3d.com/public/software/dazstudio/4/referenceguide/scripting/api_reference/object_index/property_dz
- https://docs.daz3d.com/public/software/dazstudio/4/referenceguide/scripting/api_reference/object_index/texturemodifier_dz
- https://docs.daz3d.com/public/software/dazstudio/4/referenceguide/scripting/api_reference/object_index/texturecomponent_dz
- https://docs.daz3d.com/public/software/dazstudio/4/referenceguide/scripting/api_reference/object_index/texturelayer_dz
- https://docs.daz3d.com/public/software/dazstudio/4/change_log_4_11_0_383
- https://docs.daz3d.com/public/software/dazstudio/4/change_log_4_23_0_1
- https://docs.daz3d.com/public/software/dazstudio/4/change_log_4_24_0_3