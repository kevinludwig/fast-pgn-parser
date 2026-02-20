/**
 * N-API bindings for libpgn. Exposes Parser with nextGame() for streaming games.
 */
#include <napi.h>
#include <string>
#include <vector>
#include <cstring>

extern "C" {
#include "pgn.h"
}

static napi_value pgn_metadata_to_object(napi_env env, pgn_metadata_t* meta) {
  napi_value obj;
  napi_create_object(env, &obj);
  if (!meta || !meta->items) return obj;
  for (size_t i = 0; i < meta->length; i++) {
    __pgn_metadata_item_t* item = &meta->items[i];
    if (!item->key || !item->key->buf || !item->value || !item->value->buf) continue;
    napi_value key_val, value_val;
    napi_create_string_utf8(env, item->key->buf, item->key->length, &key_val);
    napi_create_string_utf8(env, item->value->buf, item->value->length, &value_val);
    napi_set_property(env, obj, key_val, value_val);
  }
  return obj;
}

static napi_value pgn_to_game_object(napi_env env, pgn_t* pgn) {
  napi_value game;
  napi_create_object(env, &game);

  napi_value tags = pgn_metadata_to_object(env, pgn->metadata);
  napi_set_named_property(env, game, "tags", tags);

  const char* result_str = pgn_score_to_string(pgn->score);
  napi_value result;
  napi_create_string_utf8(env, result_str ? result_str : "*", NAPI_AUTO_LENGTH, &result);
  napi_set_named_property(env, game, "result", result);

  napi_value moves_array;
  napi_create_array_with_length(env, 0, &moves_array);
  if (pgn->moves && pgn->moves->values) {
    size_t idx = 0;
    for (size_t i = 0; i < pgn->moves->length; i++) {
      napi_value white_move;
      napi_create_string_utf8(env, pgn->moves->values[i].white.notation, NAPI_AUTO_LENGTH, &white_move);
      napi_set_element(env, moves_array, idx++, white_move);
      if (pgn->moves->values[i].black.notation[0] != '\0') {
        napi_value black_move;
        napi_create_string_utf8(env, pgn->moves->values[i].black.notation, NAPI_AUTO_LENGTH, &black_move);
        napi_set_element(env, moves_array, idx++, black_move);
      }
    }
    napi_set_named_property(env, game, "moves", moves_array);
  } else {
    napi_set_named_property(env, game, "moves", moves_array);
  }

  return game;
}

class ParserWrapper : public Napi::ObjectWrap<ParserWrapper> {
 public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  ParserWrapper(const Napi::CallbackInfo& info);

 private:
  Napi::Value NextGame(const Napi::CallbackInfo& info);
  std::string text_;
  size_t offset_{0};
};

Napi::Object ParserWrapper::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "Parser", {
    InstanceMethod("nextGame", &ParserWrapper::NextGame),
  });
  Napi::Object constructor = func.Get("constructor").As<Napi::Object>();
  exports.Set("Parser", func);
  return exports;
}

ParserWrapper::ParserWrapper(const Napi::CallbackInfo& info)
  : Napi::ObjectWrap<ParserWrapper>(info) {
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected string (pgnText)").ThrowAsJavaScriptException();
    return;
  }
  text_ = info[0].As<Napi::String>().Utf8Value();
}

Napi::Value ParserWrapper::NextGame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (offset_ >= text_.size()) {
    return env.Null();
  }
  // Skip leading whitespace between games
  while (offset_ < text_.size() && (text_[offset_] == ' ' || text_[offset_] == '\n' || text_[offset_] == '\r' || text_[offset_] == '\t')) {
    offset_++;
  }
  if (offset_ >= text_.size()) {
    return env.Null();
  }
  std::vector<char> mutable_buf(text_.begin() + offset_, text_.end());
  mutable_buf.push_back('\0');
  pgn_t* pgn = pgn_init();
  if (!pgn) {
    return env.Null();
  }
  size_t consumed = pgn_parse(pgn, mutable_buf.data());
  if (consumed == 0) {
    pgn_cleanup(pgn);
    return env.Null();
  }
  size_t start = offset_;
  offset_ += consumed;
  std::string pgntext = text_.substr(start, consumed);
  napi_value gameVal = pgn_to_game_object(env, pgn);
  pgn_cleanup(pgn);
  napi_value pgntextVal;
  napi_create_string_utf8(env, pgntext.c_str(), pgntext.size(), &pgntextVal);
  napi_set_named_property(env, gameVal, "pgntext", pgntextVal);
  return Napi::Value(env, gameVal);
}

static Napi::Object Init(Napi::Env env, napi_value exports_val) {
  return ParserWrapper::Init(env, Napi::Object(env, exports_val));
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
