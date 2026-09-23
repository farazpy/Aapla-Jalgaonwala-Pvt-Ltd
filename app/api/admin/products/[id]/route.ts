import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository } from '@/server/repositories/ProductRepository';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await ProductRepository.getById(id);

    if (!product) {
      return NextResponse.json(
        { success: false, error: { message: 'Product not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (err) {
    console.error('Admin GET product by id error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch product' } },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updatedProduct = await ProductRepository.update(id, body);

    if (!updatedProduct) {
      return NextResponse.json(
        { success: false, error: { message: 'Product not found or update failed' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully in MySQL database'
    });
  } catch (err) {
    console.error('Admin PUT product error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to update product' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await ProductRepository.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: { message: 'Failed to delete product' } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully from MySQL database'
    });
  } catch (err) {
    console.error('Admin DELETE product error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to delete product' } },
      { status: 500 }
    );
  }
}
