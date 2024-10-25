package com.example.db

import com.google.gson.*
import java.lang.reflect.Type
import com.example.BuildConfig

class ModuleDeserializer : JsonDeserializer<Module> {
  override fun deserialize(json: JsonElement, typeOfT: Type, context: JsonDeserializationContext): Module {
    val jsonObject = json.asJsonObject

    return Module(
      name = jsonObject.get("name").asString,
      hash = jsonObject.get("hash").asString,
      filepath = jsonObject.get("filepath").asString,
      versionCode = jsonObject.get("versionCode")?.asLong ?: BuildConfig.VERSION_CODE.toLong(),
      type = jsonObject.get("type")?.asInt ?: ModuleType.TYPE_SPLIT.ordinal,
      enabled = jsonObject.get("enabled")?.asBoolean ?: true,
      usageCount = jsonObject.get("usageCount")?.asLong ?: 0,
      exceptionCount = jsonObject.get("exceptionCount")?.asLong ?: 0,
      createTime = jsonObject.get("createTime")?.asLong ?: System.currentTimeMillis(),
      updateTime = jsonObject.get("updateTime")?.asLong ?: System.currentTimeMillis()
    )
  }
}
