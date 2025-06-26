#!/usr/bin/env python3
"""
Test database connection and table access
"""
import sys
import os

# Add the src directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from sqlalchemy import text
from src.database.relational.connection import user_engine

def test_database_connection():
    """Test database connection and table access"""
    try:
        # Create a connection
        with user_engine.connect() as connection:
            print("✅ Database connection successful")
            
            # Test if we can query the users table
            result = connection.execute(text("SELECT COUNT(*) FROM users"))
            count = result.scalar()
            print(f"✅ Users table accessible. Current row count: {count}")
            
            # Test if we can see the table structure
            result = connection.execute(text("DESCRIBE users"))
            columns = result.fetchall()
            print("✅ Table structure:")
            for column in columns:
                print(f"  - {column[0]}: {column[1]}")
            
            # Test if we can insert a test record
            test_email = "test@example.com"
            result = connection.execute(
                text("INSERT INTO users (email, role) VALUES (:email, 'user')"),
                {"email": test_email}
            )
            print(f"✅ Test insert successful for {test_email}")
            
            # Clean up test record
            connection.execute(
                text("DELETE FROM users WHERE email = :email"),
                {"email": test_email}
            )
            print(f"✅ Test cleanup successful")
            
            connection.commit()
            print("✅ All database operations successful")
            
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing database connection and table access...")
    success = test_database_connection()
    
    if success:
        print("\n🎉 Database connection test passed!")
    else:
        print("\n💥 Database connection test failed!")
        sys.exit(1) 