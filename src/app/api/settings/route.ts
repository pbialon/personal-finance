import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value');

    if (error) {
      // If table doesn't exist, return empty settings
      if (error.code === '42P01') {
        return NextResponse.json({});
      }
      throw error;
    }

    // Convert array to object
    const settings = (data || []).reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, unknown>);

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('app_settings')
      .upsert({ key, value }, { onConflict: 'key' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update setting:', error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}
