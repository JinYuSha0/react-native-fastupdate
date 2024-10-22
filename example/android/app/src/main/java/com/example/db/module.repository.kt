package com.example.db

import com.example.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ModuleRepository(private val moduleDao: ModuleDao) {
  suspend fun insertModule(module: Module) {
    withContext(Dispatchers.IO) {
      moduleDao.insert(module)
    }
  }

  suspend fun findAvailableModuleByName(name: String): Module? {
    return withContext(Dispatchers.IO) {
      val versionCode = BuildConfig.VERSION_CODE.toLong()
      moduleDao.findAvailableModuleByName(name, versionCode)
    }
  }

  suspend fun incrementUsageCount(moduleId: Long) {
    return withContext(Dispatchers.IO) {
      val updateTime = System.currentTimeMillis()
      moduleDao.incrementUsageCount(moduleId, updateTime)
    }
  }

  suspend fun incrementExceptionCount(moduleId: Long) {
    return withContext(Dispatchers.IO) {
      val updateTime = System.currentTimeMillis()
      moduleDao.incrementExceptionCount(moduleId, updateTime)
    }
  }
}
