package com.example.db

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import com.example.BuildConfig

enum class ModuleType {
  TYPE_COMMON,
  TYPE_BOOT,
  TYPE_SPLIT
}

@Entity(
  tableName = "module",
  indices = [Index(value = ["name"])]
)
data class Module(
  @PrimaryKey(autoGenerate = true) val id: Long = 0,
  @ColumnInfo(name = "name") val name: String,
  @ColumnInfo(name = "hash") val hash: String,
  @ColumnInfo(name = "file_path") val filepath: String,
  @ColumnInfo(name = "version_code") val versionCode: Long = BuildConfig.VERSION_CODE.toLong(),
  @ColumnInfo(name = "type") val type: ModuleType = ModuleType.TYPE_SPLIT,
  @ColumnInfo(name = "enabled") val enabled: Boolean = true,
  @ColumnInfo(name = "usage_count") val usageCount: Long = 0,
  @ColumnInfo(name = "exception_count") val exceptionCount: Long = 0,
  @ColumnInfo(name = "create_time") val createTime: Long = System.currentTimeMillis(),
  @ColumnInfo(name = "update_time") val updateTime: Long = System.currentTimeMillis()
)
