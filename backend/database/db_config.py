"""
Database Configuration and Connection Management
ScholarSense - AI-Powered Academic Intelligence System
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import urllib for URL encoding
from urllib.parse import quote_plus

# Check if DATABASE_URL is provided directly (for Render/Heroku)
DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    # Fallback: build from individual environment variables
    DATABASE_CONFIG = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', '5432'),
        'database': os.getenv('DB_NAME', 'scholarsense'),
        'user': os.getenv('DB_USER', 'scholar_admin'),
        'password': os.getenv('DB_PASSWORD', 'Scholar@2026')
    }
    
    # Create Database URL with encoded password
    DATABASE_URL = (
        f"postgresql://{DATABASE_CONFIG['user']}:{quote_plus(DATABASE_CONFIG['password'])}"
        f"@{DATABASE_CONFIG['host']}:{DATABASE_CONFIG['port']}/{DATABASE_CONFIG['database']}"
    )
else:
    # Parse DATABASE_URL for display purposes
    DATABASE_CONFIG = {
        'host': 'from DATABASE_URL',
        'port': 'from DATABASE_URL',
        'database': 'from DATABASE_URL',
        'user': 'from DATABASE_URL',
        'password': '***'
    }

# Create SQLAlchemy Engine with NullPool for serverless environments
engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,  # No persistent connections (better for serverless)
    pool_pre_ping=True,  # Verify connections before using
    echo=False,  # Set to True for SQL debugging
    connect_args={
        'client_encoding': 'utf8',
        'connect_timeout': 10,
    }
)

# Create Session Factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for ORM models
Base = declarative_base()

# Dependency for getting DB session
def get_db():
    """
    Database session dependency for API routes
    Usage: db = next(get_db())
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Test connection
def test_connection():
    """Test database connection"""
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ Database connection successful!")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

# Get database info
def get_database_info():
    """Get database connection info"""
    try:
        with engine.connect() as connection:
            # Get PostgreSQL version
            version_result = connection.execute(text("SELECT version()"))
            version = version_result.fetchone()[0]
            
            # Get table count
            table_result = connection.execute(text(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
            ))
            table_count = table_result.fetchone()[0]
            
            # Get student count
            student_result = connection.execute(text("SELECT COUNT(*) FROM students"))
            student_count = student_result.fetchone()[0]
            
            # Get user count
            user_result = connection.execute(text("SELECT COUNT(*) FROM users"))
            user_count = user_result.fetchone()[0]
            
            return {
                'status': 'connected',
                'database': DATABASE_CONFIG['database'],
                'host': DATABASE_CONFIG['host'],
                'port': DATABASE_CONFIG['port'],
                'tables': table_count,
                'students': student_count,
                'users': user_count,
                'version': version.split(',')[0]
            }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

# Main test
if __name__ == "__main__":
    print("=" * 60)
    print("🔍 TESTING DATABASE CONNECTION")
    print("=" * 60)
    
    # Test basic connection
    if test_connection():
        # Get detailed info
        info = get_database_info()
        if info['status'] == 'connected':
            print("\n📊 DATABASE INFORMATION:")
            print(f"   Database: {info['database']}")
            print(f"   Host: {info['host']}:{info['port']}")
            print(f"   Tables: {info['tables']}")
            print(f"   Students: {info['students']}")
            print(f"   Users: {info['users']}")
            print(f"   Version: {info['version']}")
            print("\n✅ All database checks passed!")
        else:
            print(f"\n❌ Error getting database info: {info['message']}")
    else:
        print("\n❌ Database connection test failed!")
    
    print("=" * 60)
