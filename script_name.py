import mysql.connector
import re
from mysql.connector import Error

# 数据库连接配置
DB_CONFIG = {
    'host': '106.52.220.73',
    'port': 3306,
    'user': 'root', 
    'password': 'SuijoYuki514',
    'database': 'mofukaze'
}

# 读取hashMap.txt文件并创建映射字典
def load_hash_map(file_path='hashMap.txt'):
    hash_map = {}
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if '→' in line:
                parts = line.split('→')
                if len(parts) == 2:
                    original = parts[0].replace('✔ ', '').strip()
                    hash_value = parts[1].strip()
                    
                    # 根据hash值动态生成路径
                    # 前两个字符作为第一级目录
                    dir1 = hash_value[:2]
                    # 第三四个字符作为第二级目录
                    dir2 = hash_value[2:4]
                    # 完整路径格式
                    formatted_path = f"{dir1}/{dir2}/{hash_value}"
                    
                    hash_map[original] = formatted_path
    return hash_map

# 连接数据库并执行替换
def update_database_records(table_name, column_name, hash_map):
    try:
        # 建立数据库连接
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # 统计更新数量
        total_updated = 0
        
        # 对每个映射进行搜索和替换
        for original, replacement in hash_map.items():
            # 转义特殊字符用于LIKE查询
            escaped_original = original.replace('%', '\\%').replace('_', '\\_')
            
            # 查询包含该字符串的记录
            select_query = f"""
                SELECT {column_name} 
                FROM {table_name} 
                WHERE {column_name} LIKE %s
            """
            cursor.execute(select_query, (f"%{escaped_original}%",))
            records = cursor.fetchall()
            
            if records:
                # 更新记录，将原始字符串替换为新格式
                update_query = f"""
                    UPDATE {table_name} 
                    SET {column_name} = REPLACE({column_name}, %s, %s)
                    WHERE {column_name} LIKE %s
                """
                cursor.execute(update_query, (original, replacement, f"%{escaped_original}%"))
                connection.commit()
                
                updated_count = cursor.rowcount
                total_updated += updated_count
                print(f"更新了 {updated_count} 条记录：'{original}' → '{replacement}'")
        
        print(f"\n总共更新了 {total_updated} 条记录")
        
    except Error as e:
        print(f"数据库错误: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def main():
    # 配置这些参数
    TABLE_NAME = 'article'  # 替换为你的表名
    COLUMN_NAME = 'content'  # 替换为你的列名
    
    # 加载映射关系
    hash_map = load_hash_map('hashMap.txt')
    print(f"加载了 {len(hash_map)} 个映射关系")
    
    # 打印前几个映射示例
    print("\n映射示例:")
    for i, (k, v) in enumerate(hash_map.items()):
        if i < 5:  # 只显示前5个
            print(f"  {k} → {v}")
        else:
            break
    
    # 执行数据库更新
    update_database_records(TABLE_NAME, COLUMN_NAME, hash_map)

if __name__ == "__main__":
    main()