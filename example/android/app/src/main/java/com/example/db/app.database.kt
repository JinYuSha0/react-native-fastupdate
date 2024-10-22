package com.example.db

import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import android.content.Context

@Database(entities = [Module::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
  abstract fun moduleDao(): ModuleDao

  companion object {
    @Volatile
    private var INSTANCE: AppDatabase? = null

    private fun getInstance(context: Context): AppDatabase {
      return INSTANCE ?: synchronized(this) {
        val instance = Room.databaseBuilder(
          context,
          AppDatabase::class.java,
          "rn_fast_update_database"
        )
          .fallbackToDestructiveMigration()
          .allowMainThreadQueries()
          .build()
        INSTANCE = instance
        instance
      }
    }

    fun getModuleRepository(context: Context): ModuleRepository {
      val database = getInstance(context)
      return ModuleRepository(database.moduleDao())
    }
  }
}
