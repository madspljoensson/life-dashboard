"""Seed initial inventory data for Mads."""
from datetime import datetime
from database import SessionLocal
from models import InventoryItem, InventoryCategory

def seed_data():
    db = SessionLocal()
    
    try:
        # Check if already seeded
        existing_items = db.query(InventoryItem).count()
        if existing_items > 0:
            print(f"⚠️  Database already has {existing_items} items. Skipping seed.")
            return
        
        # Seed categories
        categories = [
            {'name': 'tech', 'color': '#8b7cf6'},
            {'name': 'home', 'color': '#fbbf24'},
            {'name': 'health', 'color': '#4ade80'},
            {'name': 'kitchen', 'color': '#f87171'},
            {'name': 'clothing', 'color': '#60a5fa'},
            {'name': 'edc', 'color': '#94a3b8'},
            {'name': 'other', 'color': '#5a5a66'},
        ]
        
        for cat in categories:
            db_cat = InventoryCategory(**cat)
            db.add(db_cat)
        
        db.commit()
        print("✅ Categories seeded")
        
        # Seed owned items
        owned_items = [
            {'name': 'AirPods (noise-cancelling)', 'category': 'tech'},
            {'name': 'External Monitor', 'category': 'tech'},
            {'name': 'Daylight/SAD Lamp', 'category': 'health'},
            {'name': 'Logitech MX Master 3S Mouse', 'category': 'tech'},
            {'name': 'MacBook Pro', 'category': 'tech'},
            {'name': 'Windows XPS Laptop', 'category': 'tech'},
            {'name': 'Air Fryer', 'category': 'kitchen'},
            {'name': 'Home Toolkit', 'category': 'home'},
        ]
        
        for item in owned_items:
            db_item = InventoryItem(
                name=item['name'],
                category=item['category'],
                status='owned',
                currency='DKK',
            )
            db.add(db_item)
        
        db.commit()
        print("✅ Owned items seeded")
        
        # Seed wishlist items
        wishlist_items = [
            {'name': 'Logitech MX Keys S (Nordic)', 'category': 'tech', 'priority': 'high', 'price': 639},
            {'name': 'Goobay USB-C to HDMI cable 4K 1.8m', 'category': 'tech', 'priority': 'medium', 'price': 159},
            {'name': '2x Sleep Masks', 'category': 'health', 'priority': 'medium', 'price': 90},
            {'name': 'Robot Vacuum Cleaner', 'category': 'home', 'priority': 'high', 'price': 2500},
            {'name': 'Smart Speaker', 'category': 'tech', 'priority': 'high', 'price': 1500},
        ]
        
        for item in wishlist_items:
            db_item = InventoryItem(
                name=item['name'],
                category=item['category'],
                status='wishlist',
                priority=item['priority'],
                price=item['price'],
                currency='DKK',
            )
            db.add(db_item)
        
        db.commit()
        print("✅ Wishlist items seeded")
        
        # Seed AI suggested items
        ai_suggested_items = [
            {
                'name': 'Vitamin D Supplements',
                'category': 'health',
                'priority': 'high',
                'price': 50,
                'ai_reason': 'Living in Denmark = vitamin D deficiency risk. Most Danes are deficient in winter.',
            },
            {
                'name': 'Skincare Basics (Cerave/The Ordinary)',
                'category': 'health',
                'priority': 'high',
                'price': 300,
                'ai_reason': 'At 26, starting a simple routine (cleanser, moisturizer, SPF) pays off massively.',
            },
            {
                'name': 'Quality Pillow',
                'category': 'home',
                'priority': 'high',
                'price': 500,
                'ai_reason': 'You spend 1/3 of your life on it. Sleep mask + good pillow = next-level sleep.',
            },
            {
                'name': 'Ergonomic Laptop Stand',
                'category': 'tech',
                'priority': 'medium',
                'price': 400,
                'ai_reason': 'Screen at eye level prevents neck strain. Essential for daily laptop use.',
            },
            {
                'name': 'Cordless Vacuum',
                'category': 'home',
                'priority': 'medium',
                'price': 2000,
                'ai_reason': 'For quick messes the robot vacuum misses. Handheld mode for shelves/corners.',
            },
            {
                'name': '8sleep Mattress',
                'category': 'health',
                'priority': 'low',
                'price': 15000,
                'tags': 'long-term',
                'ai_reason': 'Temperature-controlled sleep surface. Major health investment for the future.',
            },
        ]
        
        for item in ai_suggested_items:
            db_item = InventoryItem(
                name=item['name'],
                category=item['category'],
                status='ai_suggested',
                priority=item['priority'],
                price=item['price'],
                currency='DKK',
                ai_reason=item['ai_reason'],
                tags=item.get('tags'),
            )
            db.add(db_item)
        
        db.commit()
        print("✅ AI suggested items seeded")
        
        print(f"\n🎉 Successfully seeded inventory with {len(owned_items) + len(wishlist_items) + len(ai_suggested_items)} items")
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
