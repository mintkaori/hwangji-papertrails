// 황지 페이퍼트레일: change a texture's anisotropic filtering in place.
// three.js applies texture.anisotropy only when it uploads a texture (and never again for a render-target texture), so a
// quality change used to re-upload the paper fibre (needsUpdate) and could not touch the print atlas at all. This sets
// the sampler parameter on the live GL texture instead, through three's state cache so its bindings stay in sync.
// A texture that is not on the GPU yet just keeps the new value for its first upload.

const TARGETS = { array: 0x8c1a /* TEXTURE_2D_ARRAY */, tex3d: 0x806f /* TEXTURE_3D */, cube: 0x8513 /* TEXTURE_CUBE_MAP */, tex2d: 0x0de1 /* TEXTURE_2D */ };

/** Anisotropy `n` (1 = off) on `tex`, clamped to what the GPU offers. Never throws. */
export function setAnisotropy(renderer, tex, n) {
  if (!tex || !tex.isTexture) return;
  const want = Math.max(1, Math.round(n || 1));
  tex.anisotropy = want;
  if (!renderer) return;
  try {
    const p = renderer.properties.get(tex);
    if (!p || !p.__webglTexture) return; // not uploaded yet: the value above is used at upload
    const ext = renderer.extensions.get('EXT_texture_filter_anisotropic');
    if (!ext) return;
    const gl = renderer.getContext();
    const target = tex.isDataArrayTexture || tex.isCompressedArrayTexture ? TARGETS.array
      : tex.isData3DTexture ? TARGETS.tex3d : tex.isCubeTexture ? TARGETS.cube : TARGETS.tex2d;
    renderer.state.bindTexture(target, p.__webglTexture);
    gl.texParameterf(target, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(want, renderer.capabilities.getMaxAnisotropy() || 1));
    p.__currentAnisotropy = want;
  } catch { /* keep whatever the texture had */ }
}
