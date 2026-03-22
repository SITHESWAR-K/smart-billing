import { Edit2, Trash2 } from 'lucide-react'

const ProductCard = ({ product, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">{product.name}</h3>
        {product.brand && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
            {product.brand}
          </span>
        )}
      </div>
      
      {product.synonyms && product.synonyms.length > 0 && (
        <p className="text-gray-500 text-xs mb-2">
          Also known as: {Array.isArray(product.synonyms) ? product.synonyms.join(', ') : product.synonyms}
        </p>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <span className="text-2xl font-bold text-indigo-600">₹{product.price}</span>
        {product.quantity && (
          <span className="text-sm text-gray-600">
            Qty: {product.quantity}
          </span>
        )}
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(product)}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
        >
          <Edit2 size={16} />
          Edit
        </button>
        <button
          onClick={() => onDelete(product.id)}
          className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  )
}

export default ProductCard