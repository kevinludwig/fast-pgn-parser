{
  "targets": [{
    "target_name": "pgn_parser",
    "sources": [
      "src/binding.cc",
      "vendor/libpgn/annotation.c",
      "vendor/libpgn/check.c",
      "vendor/libpgn/comments.c",
      "vendor/libpgn/coordinate.c",
      "vendor/libpgn/metadata.c",
      "vendor/libpgn/moves.c",
      "vendor/libpgn/pgn.c",
      "vendor/libpgn/piece.c",
      "vendor/libpgn/score.c",
      "vendor/libpgn/utils/buffer.c",
      "vendor/libpgn/utils/cursor.c",
      "vendor/libpgn/utils/export.c"
    ],
    "include_dirs": [
      "<!@(node -p \"require('node-addon-api').include\")",
      "vendor/libpgn",
      "vendor/libpgn/utils"
    ],
    "dependencies": ["<!(node -p \"require('node-addon-api').gyp\")"],
    "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
    "cflags!": ["-fno-exceptions"],
    "cflags_cc!": ["-fno-exceptions"],
    "conditions": [
      ["OS=='win'", {
        "defines": ["PGN_STATIC_BUILD"],
        "msvs_settings": {
          "VCCLCompilerTool": {
            "ExceptionHandling": 1
          }
        }
      }],
      ["OS!='win'", {
        "cflags": ["-std=c99"],
        "cflags_cc": ["-std=c++17"]
      }]
    ]
  }]
}
