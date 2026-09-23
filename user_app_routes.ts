// --- MOBILE APP SPECIFIC ENDPOINTS --- //

apiRouter.get('/user/orders', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) return res.status(401).json(createErrorResponse('Unauthorized: Invalid or missing authentication token'));

    const orders = await OrderRepository.getByUser({ userId: user.id, email: user.email, phone: user.phone });
    return res.json(createSuccessResponse(orders));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch user orders'));
  }
});

apiRouter.get('/user/addresses', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) return res.status(401).json(createErrorResponse('Unauthorized: Invalid or missing authentication token'));

    const addresses = await UserRepository.getAddresses(user.id);
    return res.json(createSuccessResponse(addresses));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch user addresses'));
  }
});

apiRouter.get('/user/addresses/:id', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) return res.status(401).json(createErrorResponse('Unauthorized: Invalid or missing authentication token'));

    const addresses = await UserRepository.getAddresses(user.id);
    const address = addresses.find(a => a.id === req.params.id);
    
    if (!address) return res.status(404).json(createErrorResponse('Address not found'));
    
    return res.json(createSuccessResponse(address));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch address'));
  }
});

apiRouter.post('/user/addresses', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) return res.status(401).json(createErrorResponse('Unauthorized: Invalid or missing authentication token'));

    const newAddress = await UserRepository.saveAddress(user.id, req.body);
    return res.json(createSuccessResponse(newAddress));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to create address'));
  }
});

apiRouter.put('/user/addresses/:id', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) return res.status(401).json(createErrorResponse('Unauthorized: Invalid or missing authentication token'));

    const updatedAddress = await UserRepository.saveAddress(user.id, { ...req.body, id: req.params.id });
    return res.json(createSuccessResponse(updatedAddress));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update address'));
  }
});

apiRouter.delete('/user/addresses/:id', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) return res.status(401).json(createErrorResponse('Unauthorized: Invalid or missing authentication token'));

    await UserRepository.deleteAddress(user.id, req.params.id);
    return res.json(createSuccessResponse({ success: true, message: 'Address deleted' }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to delete address'));
  }
});

apiRouter.get('/user/wishlist', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) return res.status(401).json(createErrorResponse('Unauthorized: Invalid or missing authentication token'));

    // Returns empty array for now since wishlist is not implemented in db.
    return res.json(createSuccessResponse([]));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch wishlist'));
  }
});

apiRouter.get('/user/payments', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) return res.status(401).json(createErrorResponse('Unauthorized: Invalid or missing authentication token'));

    const orders = await OrderRepository.getByUser({ userId: user.id, email: user.email, phone: user.phone });
    
    const payments = orders.map(order => ({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.total,
      currency: 'INR',
      method: order.paymentMethod,
      status: order.paymentStatus,
      date: order.createdAt
    }));
    
    return res.json(createSuccessResponse(payments));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch user payments'));
  }
});

