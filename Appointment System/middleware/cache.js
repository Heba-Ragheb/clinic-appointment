import client from "../config/redis.js";


export const cacheProducts = async(req,res,next)=>{
   if(!client.isReady) {
      console.log('⚠️ Redis not ready, skipping cache');
    return next();
   }
    const cacheKey = 'products:list'
    try {
        const cachedData = await client.get(cacheKey)
        if(cachedData){
            console.log('cache hit')
            return res.json(JSON.parse(cachedData))
        }
        console.log('cache miss')
        const originalJson=res.json.bind(res)
        res.json=(data)=>{
            client.setEx(cacheKey,3600,JSON.stringify(data))
            .then(()=> console.log('💾 Response cached for 1 hour'))
            .catch(err => console.error('Cache save error:', err.message))
            return originalJson(data)
        }
        next();
    } catch (error) {
        console.error('Cache middleware error:', error.message);
    next(); 
    }
}
export const clearProductsCache = async () => {
  try {
    await client.del('products:list');
    console.log('🗑️ Products cache cleared');
  } catch (error) {
    console.error('Clear cache error:', error.message);
  }
};