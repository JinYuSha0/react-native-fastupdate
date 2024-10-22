package com.example.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update

@Dao
interface ModuleDao {
  @Insert
  suspend fun insert(module: Module)

  @Update
  suspend fun update(module: Module)

  @Query("SELECT * FROM module WHERE name = :name AND version_code = :versionCode AND enabled = 1 ORDER BY id DESC LIMIT 1")
  suspend fun findAvailableModuleByName(name: String, versionCode: Long): Module?

  @Query("UPDATE module SET usage_count = usage_count + 1, create_time = :updateTime WHERE id = :moduleId")
  suspend fun incrementUsageCount(moduleId: Long, updateTime: Long)

  @Query("UPDATE module SET exception_count = exception_count + 1, update_time = :updateTime WHERE id = :moduleId")
  suspend fun incrementExceptionCount(moduleId: Long, updateTime: Long)
}
