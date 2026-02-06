(function () {
  "use strict";

  if (!window.Q3D || !window.THREE) return;

  var app = Q3D.application;
  var state = {
    enabled: false,
    color: new THREE.Color(1, 1, 1),
    tolerance: 0.18
  };

  function updateMaterialUniforms(material) {
    var shader = material && material.userData ? material.userData.nlcdHighlightShader : null;
    if (!shader) return;

    shader.uniforms.nlcdHighlightEnabled.value = state.enabled ? 1 : 0;
    shader.uniforms.nlcdHighlightColor.value.copy(state.color);
    shader.uniforms.nlcdHighlightTolerance.value = state.tolerance;
  }

  function ensureHighlightMaterial(material) {
    if (!material || !material.map || (material.userData && material.userData.nlcdHighlightApplied)) return;

    material.userData = material.userData || {};
    material.userData.nlcdHighlightApplied = true;
    var baseOnBeforeCompile = material.onBeforeCompile;

    material.onBeforeCompile = function (shader) {
      if (baseOnBeforeCompile) baseOnBeforeCompile(shader);

      shader.uniforms.nlcdHighlightEnabled = { value: state.enabled ? 1 : 0 };
      shader.uniforms.nlcdHighlightColor = { value: state.color.clone() };
      shader.uniforms.nlcdHighlightTolerance = { value: state.tolerance };

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        "#include <common>\n" +
          "uniform float nlcdHighlightEnabled;\n" +
          "uniform vec3 nlcdHighlightColor;\n" +
          "uniform float nlcdHighlightTolerance;\n"
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <dithering_fragment>",
        "vec4 baseColor = gl_FragColor;\n" +
          "vec3 rgb = baseColor.rgb;\n" +
          "vec3 rgbLinear = pow(rgb, vec3(2.2));\n" +
          "vec3 targetLinear = pow(nlcdHighlightColor, vec3(2.2));\n" +
          "float dist = distance(rgbLinear, targetLinear);\n" +
          "float match = 1.0 - smoothstep(nlcdHighlightTolerance, nlcdHighlightTolerance * 1.5, dist);\n" +
          "float lum = dot(rgb, vec3(0.299, 0.587, 0.114));\n" +
          "vec3 gray = vec3(lum);\n" +
          "vec3 outColor = mix(gray, rgb, match);\n" +
          "if (nlcdHighlightEnabled < 0.5) {\n" +
          "  gl_FragColor = baseColor;\n" +
          "} else {\n" +
          "  gl_FragColor = vec4(outColor, baseColor.a);\n" +
          "}\n" +
          "#include <dithering_fragment>"
      );

      material.userData.nlcdHighlightShader = shader;
    };

    material.needsUpdate = true;
  }

  function applyHighlightToScene() {
    if (!app || !app.scene || !app.scene.mapLayers) return;

    Object.keys(app.scene.mapLayers).forEach(function (layerId) {
      var layer = app.scene.mapLayers[layerId];
      if (!layer || !layer.materials || !layer.materials.array) return;

      layer.materials.array.forEach(function (q3dMaterial) {
        if (!q3dMaterial || !q3dMaterial.mtl) return;
        ensureHighlightMaterial(q3dMaterial.mtl);
        updateMaterialUniforms(q3dMaterial.mtl);
      });
    });

    if (app.render) app.render();
  }

  function setHighlight(payload) {
    if (!payload || payload.type !== "nlcd:highlight") return;

    if (payload.enabled && payload.color) {
      state.enabled = true;
      state.color.set(payload.color);
    } else {
      state.enabled = false;
    }

    if (typeof payload.tolerance === "number") {
      state.tolerance = payload.tolerance;
    }

    applyHighlightToScene();
  }

  window.addEventListener("message", function (event) {
    setHighlight(event.data);
  });

  if (app && app.addEventListener) {
    app.addEventListener("sceneLoaded", function () {
      applyHighlightToScene();
    });
  }
})();
