<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\View\View;

class SolutionController extends Controller
{
    /**
     * 显示解决方案主页
     */
    public function index(): View
    {
        return view('solutions.index');
    }

    /**
     * 显示卷绕工艺解决方案
     */
    public function woundCell(): View
    {
        $products = Product::where('process_type', 'wound')->get();
        return view('solutions.wound-cell', [
            'title' => 'Wound Cell Battery Solutions',
            'products' => $products,
        ]);
    }

    /**
     * 显示叠片工艺解决方案
     */
    public function stackedCell(): View
    {
        $products = Product::where('process_type', 'stacked')->get();
        return view('solutions.stacked-cell', [
            'title' => 'Stacked Cell Battery Solutions',
            'products' => $products,
        ]);
    }

    /**
     * 显示可穿戴设备解决方案
     */
    public function wearables(): View
    {
        $products = Product::where('applications', 'like', '%wearable%')->get();
        return view('solutions.wearables', [
            'title' => 'Wearable Device Battery Solutions',
            'products' => $products,
        ]);
    }

    /**
     * 显示医疗设备解决方案
     */
    public function medical(): View
    {
        $products = Product::where('applications', 'like', '%medical%')->get();
        return view('solutions.medical', [
            'title' => 'Medical Device Battery Solutions',
            'products' => $products,
        ]);
    }

    /**
     * 显示IoT/电源工具/智能家居解决方案
     */
    public function iot(): View
    {
        return view('solutions.iot', [
            'title' => 'IoT & Smart Devices Battery Solutions',
        ]);
    }
}
