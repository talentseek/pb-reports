'use client'

import React from 'react'
import Image from 'next/image'
import type { DemoConfig } from '@/lib/demo-configs/types'

type Props = {
    config: DemoConfig
    children: React.ReactNode
}

export default function PhoneFrame({ config, children }: Props) {
    const { colors, name, logo } = config.operator

    return (
        <>
            {/* Desktop: iPhone frame + branded background */}
            <div className="phone-frame-desktop">
                {/* Branded background */}
                <div className="phone-bg">
                    <div className="phone-bg-inner" />
                    {/* Background branding */}
                    <div className="phone-bg-brand">
                        <Image
                            src={logo}
                            alt={name}
                            width={200}
                            height={60}
                            className="phone-bg-logo"
                            unoptimized
                        />
                        <p className="phone-bg-tagline">{config.operator.tagline}</p>
                        <div className="phone-bg-powered">
                            <span>powered by</span>
                            <Image src="/logo.png" alt="ParkBunny" width={100} height={28} className="h-5 w-auto" />
                        </div>
                    </div>
                </div>

                {/* iPhone device */}
                <div className="phone-device">
                    {/* Notch / Dynamic Island */}
                    <div className="phone-island" />
                    {/* Status bar */}
                    <div className="phone-statusbar">
                        <span className="phone-time">17:30</span>
                        <div className="phone-indicators">
                            <svg width="16" height="12" viewBox="0 0 16 12" fill="white"><rect x="0" y="4" width="3" height="8" rx="0.5" opacity="0.4" /><rect x="4.5" y="3" width="3" height="9" rx="0.5" opacity="0.6" /><rect x="9" y="1" width="3" height="11" rx="0.5" opacity="0.8" /><rect x="13.5" y="0" width="3" height="12" rx="0.5" /></svg>
                            <svg width="16" height="12" viewBox="0 0 16 12" fill="white"><path d="M8 3C10.7 3 13.1 4.1 14.8 5.9L16 4.7C14 2.6 11.2 1.3 8 1.3S2 2.6 0 4.7L1.2 5.9C2.9 4.1 5.3 3 8 3Z" opacity="0.4" /><path d="M8 6.5C9.8 6.5 11.4 7.3 12.5 8.4L13.7 7.2C12.3 5.8 10.3 4.9 8 4.9S3.7 5.8 2.3 7.2L3.5 8.4C4.6 7.3 6.2 6.5 8 6.5Z" opacity="0.7" /><path d="M8 10C8.8 10 9.5 10.3 10.1 10.9L8 13L5.9 10.9C6.5 10.3 7.2 10 8 10Z" /></svg>
                            <div className="phone-battery">
                                <div className="phone-battery-body">
                                    <div className="phone-battery-fill" />
                                </div>
                                <div className="phone-battery-cap" />
                            </div>
                        </div>
                    </div>
                    {/* Screen content */}
                    <div className="phone-screen">
                        {children}
                    </div>
                    {/* Home indicator */}
                    <div className="phone-home-indicator" />
                </div>
            </div>

            {/* Mobile: full-bleed passthrough */}
            <div className="phone-frame-mobile">
                {children}
            </div>

            <style jsx global>{`
        /* Desktop: show phone, hide mobile */
        .phone-frame-desktop {
          display: none;
        }
        .phone-frame-mobile {
          display: block;
        }

        @media (min-width: 768px) {
          .phone-frame-desktop {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            position: relative;
          }
          .phone-frame-mobile {
            display: none;
          }

          /* Background */
          .phone-bg {
            position: fixed;
            inset: 0;
            z-index: 0;
            overflow: hidden;
          }
          .phone-bg-inner {
            position: absolute;
            inset: 0;
            background: linear-gradient(145deg, ${colors.secondary || '#003399'}, #000d1f);
          }
          .phone-bg-inner::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle at 30% 30%, ${colors.primary}15, transparent 60%),
                        radial-gradient(circle at 70% 70%, ${colors.accent}08, transparent 50%);
          }
          .phone-bg-brand {
            position: absolute;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            z-index: 1;
          }
          .phone-bg-logo {
            height: 32px;
            width: auto;
            object-fit: contain;
            margin: 0 auto 12px;
            opacity: 0.6;
            filter: brightness(0) invert(1);
          }
          .phone-bg-tagline {
            color: rgba(255,255,255,0.35);
            font-size: 14px;
            margin-bottom: 16px;
          }
          .phone-bg-powered {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: rgba(255,255,255,0.25);
            font-size: 12px;
          }
          .phone-bg-powered img {
            opacity: 0.3;
            filter: brightness(0) invert(1);
          }

          /* Device frame */
          .phone-device {
            position: relative;
            z-index: 10;
            width: 393px;
            height: 852px;
            border-radius: 50px;
            background: #1a1a1a;
            padding: 12px;
            box-shadow:
              0 0 0 2px #333,
              0 0 0 4px #1a1a1a,
              0 25px 60px rgba(0,0,0,0.5),
              0 0 100px rgba(0,0,0,0.3);
            overflow: hidden;
          }

          /* Dynamic Island */
          .phone-island {
            position: absolute;
            top: 16px;
            left: 50%;
            transform: translateX(-50%);
            width: 126px;
            height: 36px;
            background: #000;
            border-radius: 20px;
            z-index: 30;
          }

          /* Status bar */
          .phone-statusbar {
            position: absolute;
            top: 16px;
            left: 38px;
            right: 38px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 20;
            pointer-events: none;
          }
          .phone-time {
            font-size: 15px;
            font-weight: 600;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          }
          .phone-indicators {
            display: flex;
            align-items: center;
            gap: 5px;
          }
          .phone-battery {
            display: flex;
            align-items: center;
            gap: 1px;
          }
          .phone-battery-body {
            width: 24px;
            height: 11px;
            border: 1.5px solid rgba(255,255,255,0.9);
            border-radius: 3px;
            padding: 1.5px;
          }
          .phone-battery-fill {
            width: 100%;
            height: 100%;
            background: white;
            border-radius: 1px;
          }
          .phone-battery-cap {
            width: 2px;
            height: 5px;
            background: rgba(255,255,255,0.5);
            border-radius: 0 1px 1px 0;
          }

          /* Screen */
          .phone-screen {
            width: 100%;
            height: 100%;
            border-radius: 40px;
            overflow-y: auto;
            overflow-x: hidden;
            background: ${colors.background || '#f0f4ff'};
            -webkit-overflow-scrolling: touch;
          }
          .phone-screen::-webkit-scrollbar {
            display: none;
          }

          /* Home indicator */
          .phone-home-indicator {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 134px;
            height: 5px;
            background: rgba(255,255,255,0.3);
            border-radius: 3px;
            z-index: 30;
          }
        }
      `}</style>
        </>
    )
}
