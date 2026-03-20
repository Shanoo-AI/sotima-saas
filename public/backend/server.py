
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
import random
import string
from contextlib import asynccontextmanager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

SECRET_KEY = os.environ.get("JWT_SECRET", "stationery-saas-jwt-secret-2024")
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.users.create_index("username", unique=True)
    await db.users.create_index("shop_id")
    await db.products.create_index("shop_id")
    await db.products.create_index("barcode")
    await db.sales.create_index("shop_id")
    await db.purchases.create_index("shop_id")
    await db.shop_settings.create_index("shop_id", unique=True)
    admin = await db.users.find_one({"username": "admin"})
    if not admin:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "username": "admin",
            "password_hash": pwd_context.hash("admin123"),
            "shop_name": "Platform Admin",
            "shop_id": "admin_shop",
            "role": "admin",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Admin user seeded")
    try:
        yield
    finally:
        client.close()

app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ========================= MODELS =========================

class UserRegister(BaseModel):
    username: str
    password: str
    shop_name: str

class UserLogin(BaseModel):
    username: str
    password: str

class ProductCreate(BaseModel):
    name: str
    category: str = ""
    cost_price: float
    sale_price: float
    quantity: int = 0
    low_stock_threshold: int = 10

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    cost_price: Optional[float] = None
    sale_price: Optional[float] = None
    quantity: Optional[int] = None
    low_stock_threshold: Optional[int] = None

class CategoryCreate(BaseModel):
    name: str

class SaleItem(BaseModel):
    product_id: str
    quantity: int

class SaleCreate(BaseModel):
    items: List[SaleItem]
    discount_type: str = "none"
    discount_value: float = 0

class PurchaseCreate(BaseModel):
    product_id: str
    quantity: int
    cost_price: float
    supplier: str = ""
    notes: str = ""

class ShopSettingsUpdate(BaseModel):
    shop_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    print_format: Optional[str] = None

class AdminUserCreate(BaseModel):
    username: str
    password: str
    shop_name: str
    role: Optional[str] = "owner"

class AdminPasswordReset(BaseModel):
    new_password: Optional[str] = None

# ========================= AUTH HELPERS =========================

def create_token(user_id: str, username: str, shop_id: str, role: str):
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    return jwt.encode(
        {"user_id": user_id, "username": username, "shop_id": shop_id, "role": role, "exp": expire},
        SECRET_KEY, algorithm=ALGORITHM
    )

async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header[7:]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if not user.get("is_active", True):
            raise HTTPException(status_code=403, detail="Account deactivated")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def generate_sku(category: str):
    prefix = (category[:3] if category else "GEN").upper()
    suffix = ''.join(random.choices(string.digits, k=5))
    return f"{prefix}-{suffix}"

def generate_barcode():
    digits = [random.randint(0, 9) for _ in range(12)]
    total = sum(d * (1 if i % 2 == 0 else 3) for i, d in enumerate(digits))
    check = (10 - (total % 10)) % 10
    digits.append(check)
    return ''.join(map(str, digits))

def generate_temp_password(length: int = 10):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

# ========================= AUTH ROUTES =========================

@api_router.post("/auth/register")
async def register(data: UserRegister):
    raise HTTPException(status_code=403, detail="Self-registration disabled. Contact admin.")

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"username": data.username}, {"_id": 0})
    if not user or not pwd_context.verify(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account deactivated")
    token = create_token(user["id"], user["username"], user["shop_id"], user["role"])
    return {
        "token": token,
        "user": {"id": user["id"], "username": user["username"], "shop_name": user["shop_name"], "shop_id": user["shop_id"], "role": user["role"]}
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "username": user["username"], "shop_name": user["shop_name"], "shop_id": user["shop_id"], "role": user["role"]}

# ========================= PRODUCT ROUTES =========================

@api_router.get("/products")
async def get_products(user: dict = Depends(get_current_user)):
    products = await db.products.find({"shop_id": user["shop_id"]}, {"_id": 0}).to_list(1000)
    return products

@api_router.post("/products")
async def create_product(data: ProductCreate, user: dict = Depends(get_current_user)):
    product = {
        "id": str(uuid.uuid4()),
        "shop_id": user["shop_id"],
        "name": data.name,
        "sku": generate_sku(data.category),
        "barcode": generate_barcode(),
        "category": data.category,
        "cost_price": data.cost_price,
        "sale_price": data.sale_price,
        "quantity": data.quantity,
        "low_stock_threshold": data.low_stock_threshold,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.insert_one(product)
    product.pop("_id", None)
    return product

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, data: ProductUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.products.update_one({"id": product_id, "shop_id": user["shop_id"]}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    return product

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(get_current_user)):
    result = await db.products.delete_one({"id": product_id, "shop_id": user["shop_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ========================= CATEGORY ROUTES =========================

@api_router.get("/categories")
async def get_categories(user: dict = Depends(get_current_user)):
    categories = await db.categories.find({"shop_id": user["shop_id"]}, {"_id": 0}).to_list(100)
    return categories

@api_router.post("/categories")
async def create_category(data: CategoryCreate, user: dict = Depends(get_current_user)):
    existing = await db.categories.find_one({"shop_id": user["shop_id"], "name": data.name})
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    category = {
        "id": str(uuid.uuid4()),
        "shop_id": user["shop_id"],
        "name": data.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.categories.insert_one(category)
    category.pop("_id", None)
    return category

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, user: dict = Depends(get_current_user)):
    result = await db.categories.delete_one({"id": category_id, "shop_id": user["shop_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}

# ========================= SALES ROUTES =========================

@api_router.post("/sales")
async def create_sale(data: SaleCreate, user: dict = Depends(get_current_user)):
    items = []
    subtotal = 0
    total_cost = 0
    for item in data.items:
        product = await db.products.find_one({"id": item.product_id, "shop_id": user["shop_id"]}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product["quantity"] < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['name']}")
        item_subtotal = product["sale_price"] * item.quantity
        item_cost = product["cost_price"] * item.quantity
        subtotal += item_subtotal
        total_cost += item_cost
        items.append({
            "product_id": product["id"],
            "product_name": product["name"],
            "sku": product["sku"],
            "quantity": item.quantity,
            "sale_price": product["sale_price"],
            "cost_price": product["cost_price"],
            "subtotal": round(item_subtotal, 2)
        })
        await db.products.update_one({"id": item.product_id}, {"$inc": {"quantity": -item.quantity}})

    discount_amount = 0
    if data.discount_type == "percentage":
        discount_amount = subtotal * (data.discount_value / 100)
    elif data.discount_type == "flat":
        discount_amount = data.discount_value

    total = subtotal - discount_amount
    profit = total - total_cost
    sale = {
        "id": str(uuid.uuid4()),
        "shop_id": user["shop_id"],
        "items": items,
        "subtotal": round(subtotal, 2),
        "discount_type": data.discount_type,
        "discount_value": data.discount_value,
        "discount_amount": round(discount_amount, 2),
        "total": round(total, 2),
        "profit": round(profit, 2),
        "created_by": user["username"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.sales.insert_one(sale)
    sale.pop("_id", None)
    return sale

@api_router.get("/sales")
async def get_sales(user: dict = Depends(get_current_user)):
    sales = await db.sales.find({"shop_id": user["shop_id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return sales

# ========================= PURCHASE ROUTES =========================

@api_router.post("/purchases")
async def create_purchase(data: PurchaseCreate, user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": data.product_id, "shop_id": user["shop_id"]}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.products.update_one(
        {"id": data.product_id},
        {"$inc": {"quantity": data.quantity}, "$set": {"cost_price": data.cost_price, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    purchase = {
        "id": str(uuid.uuid4()),
        "shop_id": user["shop_id"],
        "product_id": data.product_id,
        "product_name": product["name"],
        "quantity": data.quantity,
        "cost_price": data.cost_price,
        "total_cost": round(data.cost_price * data.quantity, 2),
        "supplier": data.supplier,
        "notes": data.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.purchases.insert_one(purchase)
    purchase.pop("_id", None)
    return purchase

@api_router.get("/purchases")
async def get_purchases(user: dict = Depends(get_current_user)):
    purchases = await db.purchases.find({"shop_id": user["shop_id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return purchases

# ========================= DASHBOARD ROUTES =========================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user: dict = Depends(get_current_user)):
    shop_id = user["shop_id"]
    sales = await db.sales.find({"shop_id": shop_id}, {"_id": 0, "total": 1, "profit": 1}).to_list(10000)
    total_revenue = sum(s.get("total", 0) for s in sales)
    total_profit = sum(s.get("profit", 0) for s in sales)
    total_products = await db.products.count_documents({"shop_id": shop_id})
    low_stock = await db.products.find({"shop_id": shop_id}, {"_id": 0, "quantity": 1, "low_stock_threshold": 1}).to_list(10000)
    low_stock_count = sum(1 for p in low_stock if p.get("quantity", 0) <= p.get("low_stock_threshold", 10))
    return {
        "total_revenue": round(total_revenue, 2),
        "total_profit": round(total_profit, 2),
        "total_sales": len(sales),
        "total_products": total_products,
        "low_stock_count": low_stock_count
    }

@api_router.get("/dashboard/revenue")
async def get_revenue_data(user: dict = Depends(get_current_user)):
    sales = await db.sales.find({"shop_id": user["shop_id"]}, {"_id": 0}).to_list(10000)
    monthly = {}
    for sale in sales:
        month_key = sale.get("created_at", "")[:7]
        if month_key not in monthly:
            monthly[month_key] = {"revenue": 0, "profit": 0, "count": 0}
        monthly[month_key]["revenue"] += sale.get("total", 0)
        monthly[month_key]["profit"] += sale.get("profit", 0)
        monthly[month_key]["count"] += 1
    sorted_months = sorted(monthly.items(), key=lambda x: x[0])[-12:]
    return [{"month": m, "revenue": round(d["revenue"], 2), "profit": round(d["profit"], 2), "sales": d["count"]} for m, d in sorted_months]

@api_router.get("/dashboard/top-products")
async def get_top_products(user: dict = Depends(get_current_user)):
    sales = await db.sales.find({"shop_id": user["shop_id"]}, {"_id": 0}).to_list(10000)
    product_sales = {}
    for sale in sales:
        for item in sale.get("items", []):
            name = item.get("product_name", "Unknown")
            if name not in product_sales:
                product_sales[name] = {"name": name, "quantity": 0, "revenue": 0}
            product_sales[name]["quantity"] += item.get("quantity", 0)
            product_sales[name]["revenue"] += item.get("subtotal", 0)
    return sorted(product_sales.values(), key=lambda x: x["revenue"], reverse=True)[:10]

# ========================= SETTINGS ROUTES =========================

@api_router.get("/settings")
async def get_settings(user: dict = Depends(get_current_user)):
    settings = await db.shop_settings.find_one({"shop_id": user["shop_id"]}, {"_id": 0})
    if not settings:
        return {"shop_name": user.get("shop_name", ""), "address": "", "phone": "", "logo": "", "print_format": "a5"}
    return settings

@api_router.put("/settings")
async def update_settings(data: ShopSettingsUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.shop_settings.update_one({"shop_id": user["shop_id"]}, {"$set": update_data}, upsert=True)
    settings = await db.shop_settings.find_one({"shop_id": user["shop_id"]}, {"_id": 0})
    return settings

@api_router.post("/settings/logo")
async def upload_logo(request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    logo = body.get("logo", "")
    await db.shop_settings.update_one(
        {"shop_id": user["shop_id"]},
        {"$set": {"logo": logo, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Logo uploaded", "logo": logo}

# ========================= ADMIN ROUTES =========================

@api_router.get("/admin/shops")
async def get_all_shops(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    users = await db.users.find({"role": {"$ne": "admin"}}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.put("/admin/shops/{shop_id}/toggle")
async def toggle_shop(shop_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    target = await db.users.find_one({"shop_id": shop_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="Shop not found")
    new_status = not target.get("is_active", True)
    await db.users.update_one({"shop_id": shop_id}, {"$set": {"is_active": new_status}})
    return {"message": f"Shop {'activated' if new_status else 'deactivated'}", "is_active": new_status}

@api_router.get("/admin/stats")
async def get_admin_stats(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    total_shops = await db.users.count_documents({"role": {"$ne": "admin"}})
    active_shops = await db.users.count_documents({"role": {"$ne": "admin"}, "is_active": True})
    total_products = await db.products.count_documents({})
    total_sales_count = await db.sales.count_documents({})
    all_sales = await db.sales.find({}, {"_id": 0, "total": 1}).to_list(100000)
    total_revenue = sum(s.get("total", 0) for s in all_sales)
    return {
        "total_shops": total_shops,
        "active_shops": active_shops,
        "total_products": total_products,
        "total_sales": total_sales_count,
        "total_revenue": round(total_revenue, 2)
    }

@api_router.post("/admin/users")
async def admin_create_user(data: AdminUserCreate, user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    existing = await db.users.find_one({"username": data.username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    user_id = str(uuid.uuid4())
    shop_id = str(uuid.uuid4())
    new_user = {
        "id": user_id,
        "username": data.username,
        "password_hash": pwd_context.hash(data.password),
        "shop_name": data.shop_name,
        "shop_id": shop_id,
        "role": data.role or "owner",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(new_user)
    await db.shop_settings.insert_one({
        "id": str(uuid.uuid4()),
        "shop_id": shop_id,
        "shop_name": data.shop_name,
        "address": "",
        "phone": "",
        "logo": "",
        "print_format": "a5",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "User created", "user": {"id": user_id, "username": data.username, "shop_name": data.shop_name, "shop_id": shop_id, "role": data.role or "owner"}}

@api_router.put("/admin/users/{user_id}/toggle")
async def admin_toggle_user(user_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    target = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Cannot change admin status")
    new_status = not target.get("is_active", True)
    await db.users.update_one({"id": user_id}, {"$set": {"is_active": new_status}})
    return {"message": f"User {'activated' if new_status else 'deactivated'}", "is_active": new_status}

@api_router.put("/admin/users/{user_id}/reset-password")
async def admin_reset_password(user_id: str, data: AdminPasswordReset, user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    target = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Cannot reset admin password here")
    new_password = data.new_password or generate_temp_password()
    await db.users.update_one({"id": user_id}, {"$set": {"password_hash": pwd_context.hash(new_password)}})
    return {"message": "Password reset", "temp_password": new_password}

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    target = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete admin user")
    shop_id = target.get("shop_id")
    await db.users.delete_one({"id": user_id})
    if shop_id:
        await db.products.delete_many({"shop_id": shop_id})
        await db.sales.delete_many({"shop_id": shop_id})
        await db.purchases.delete_many({"shop_id": shop_id})
        await db.shop_settings.delete_many({"shop_id": shop_id})
        await db.categories.delete_many({"shop_id": shop_id})
    return {"message": "User deleted"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

