import { Directive, ElementRef, HostListener, Input, Output, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface PanZoomModel {
    zoomLevel: number;
    pan: { x: number; y: number };
}

@Directive({
    selector: '[appPanZoom]',
    standalone: true
})
export class PanZoomDirective implements OnDestroy, OnInit {
    @Input() zoomLevels: number = 10;
    @Input() scalePerZoomLevel: number = 2.0;
    @Input() zoomStepDuration: number = 0.2;
    @Input() freeMouseWheelFactor: number = 0.01;
    @Input() zoomToFitZoomLevelFactor: number = 0.9;
    @Input() neutralZoomLevel: number = 2;
    @Input() zoomOnMouseWheel: boolean = true;
    @Input() zoomEnabled: boolean = true;

    @Output() modelChange = new EventEmitter<PanZoomModel>();

    private currentZoomLevel: number = this.neutralZoomLevel;
    private currentPan: { x: number; y: number } = { x: 0, y: 0 };
    private isDragging: boolean = false;
    private lastMousePosition: { x: number; y: number } = { x: 0, y: 0 };
    private destroy$ = new Subject<void>();

    constructor(private el: ElementRef) { }

    ngOnInit(): void {
        // Set initial styles
        this.el.nativeElement.style.transformOrigin = 'center center';
        this.el.nativeElement.style.cursor = 'grab';
        this.updateTransform();
    }

    @HostListener('wheel', ['$event'])
    onMouseWheel(event: WheelEvent): void {
        if (!this.zoomEnabled || !this.zoomOnMouseWheel) return;
        event.preventDefault();

        const delta = event.deltaY * this.freeMouseWheelFactor;
        const newZoomLevel = Math.max(0, Math.min(this.zoomLevels - 1, this.currentZoomLevel - delta));

        if (newZoomLevel !== this.currentZoomLevel) {
            this.currentZoomLevel = newZoomLevel;
            this.updateTransform();
        }
    }

    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent): void {
        if (!this.zoomEnabled) return;
        this.isDragging = true;
        this.lastMousePosition = { x: event.clientX, y: event.clientY };
        this.el.nativeElement.style.cursor = 'grabbing';
    }

    @HostListener('mousemove', ['$event'])
    onMouseMove(event: MouseEvent): void {
        if (!this.zoomEnabled || !this.isDragging) return;

        const deltaX = event.clientX - this.lastMousePosition.x;
        const deltaY = event.clientY - this.lastMousePosition.y;

        this.currentPan.x += deltaX;
        this.currentPan.y += deltaY;

        this.lastMousePosition = { x: event.clientX, y: event.clientY };
        this.updateTransform();
    }

    @HostListener('mouseup')
    @HostListener('mouseleave')
    onMouseUp(): void {
        this.isDragging = false;
        this.el.nativeElement.style.cursor = 'grab';
    }

    @HostListener('touchstart', ['$event'])
    onTouchStart(event: TouchEvent): void {
        if (!this.zoomEnabled || event.touches.length !== 1) return;
        this.isDragging = true;
        this.lastMousePosition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
    }

    @HostListener('touchmove', ['$event'])
    onTouchMove(event: TouchEvent): void {
        if (!this.zoomEnabled || !this.isDragging || event.touches.length !== 1) return;

        const deltaX = event.touches[0].clientX - this.lastMousePosition.x;
        const deltaY = event.touches[0].clientY - this.lastMousePosition.y;

        this.currentPan.x += deltaX;
        this.currentPan.y += deltaY;

        this.lastMousePosition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
        this.updateTransform();
    }

    @HostListener('touchend')
    onTouchEnd(): void {
        this.isDragging = false;
    }

    public zoomIn(center: 'viewCenter' | 'mousePosition' = 'viewCenter'): void {
        if (!this.zoomEnabled || this.currentZoomLevel >= this.zoomLevels - 1) return;
        this.currentZoomLevel++;
        this.updateTransform();
    }

    public zoomOut(center: 'viewCenter' | 'mousePosition' = 'viewCenter'): void {
        if (!this.zoomEnabled || this.currentZoomLevel <= 0) return;
        this.currentZoomLevel--;
        this.updateTransform();
    }

    public panDelta(delta: { x: number; y: number }): void {
        if (!this.zoomEnabled) return;
        this.currentPan.x += delta.x;
        this.currentPan.y += delta.y;
        this.updateTransform();
    }

    public resetView(): void {
        if (!this.zoomEnabled) return;
        this.currentZoomLevel = this.neutralZoomLevel;
        this.currentPan = { x: 0, y: 0 };
        this.updateTransform();
    }

    private updateTransform(): void {
        if (!this.zoomEnabled) return;
        const scale = Math.pow(this.scalePerZoomLevel, this.currentZoomLevel - this.neutralZoomLevel);
        const transform = `translate(${this.currentPan.x}px, ${this.currentPan.y}px) scale(${scale})`;
        this.el.nativeElement.style.transform = transform;

        this.modelChange.emit({
            zoomLevel: this.currentZoomLevel,
            pan: this.currentPan
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
