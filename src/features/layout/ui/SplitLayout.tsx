import { FC, useRef, useState, useEffect } from "react";
import { Box } from "@mui/material";
import { useLayoutStore } from "features/layout/model/useLayoutStore";
import {
    LEFT_MIN_WIDTH_PX,
    LEFT_MAX_WIDTH_RATIO,
    LEFT_ANIMATION_TRIGGER_PX,
    LEFT_ANIMATION_DURATION,
} from "features/layout/lib/constants";
import { Colors } from "shared/ui";

type SplitLayoutProps = {
    left: React.ReactNode;
    right: React.ReactNode;
    onMinimized?: (isMinimized: boolean) => void;
}

export const SplitLayout: FC<SplitLayoutProps> = ({ left, right, onMinimized }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { leftWidth, setLeftWidth } = useLayoutStore();
    const [dragging, setDragging] = useState(false);
    const [displayWidth, setDisplayWidth] = useState(leftWidth);
    const [animating, setAnimating] = useState(false);

    const startDrag = (e: React.MouseEvent) => {
        e.preventDefault();
        setDragging(true);
        setAnimating(false);
    };

    const stopDrag = () => {
        setDragging(false);
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const currentPx = leftWidth * rect.width;

        if (currentPx < LEFT_ANIMATION_TRIGGER_PX) {
            const newRatio = LEFT_MIN_WIDTH_PX / rect.width;
            setAnimating(true);
            setDisplayWidth(newRatio);
            setLeftWidth(newRatio);
            setTimeout(() => setAnimating(false), LEFT_ANIMATION_DURATION);
        } else {
            setDisplayWidth(leftWidth);
        }
    };

    const onDrag = (e: MouseEvent) => {
        if (!dragging || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        let newWidth = (e.clientX - rect.left) / rect.width;

        if (newWidth < LEFT_MIN_WIDTH_PX / rect.width) newWidth = LEFT_MIN_WIDTH_PX / rect.width;
        if (newWidth > LEFT_MAX_WIDTH_RATIO) newWidth = LEFT_MAX_WIDTH_RATIO;

        setLeftWidth(newWidth);
        setDisplayWidth(newWidth);
    };

    useEffect(() => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const currentPx = leftWidth * rect.width;

        if (onMinimized) {
            onMinimized(currentPx <= LEFT_ANIMATION_TRIGGER_PX);
        }
    }, [leftWidth, onMinimized]);

    useEffect(() => {
        window.addEventListener("mousemove", onDrag);
        window.addEventListener("mouseup", stopDrag);
        return () => {
            window.removeEventListener("mousemove", onDrag);
            window.removeEventListener("mouseup", stopDrag);
        };
    }, [dragging, leftWidth]);

    useEffect(() => {
        const handleResize = () => {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            let newWidthPx = displayWidth * rect.width;

            if (newWidthPx < LEFT_MIN_WIDTH_PX) {
                const newRatio = LEFT_MIN_WIDTH_PX / rect.width;
                setLeftWidth(newRatio);
                setDisplayWidth(newRatio);
            }

            const maxWidthPx = LEFT_MAX_WIDTH_RATIO * rect.width;
            if (newWidthPx > maxWidthPx) {
                const newRatio = LEFT_MAX_WIDTH_RATIO;
                setLeftWidth(newRatio);
                setDisplayWidth(newRatio);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [displayWidth, setLeftWidth]);

    return (
        <Box ref={containerRef} display="flex" width="100%" height="100vh">
            <Box
                width={`${displayWidth * 100}%`}
                height="100%"
                bgcolor={Colors.DARK_GRAY}
                sx={{
                    transition: animating ? `width ${LEFT_ANIMATION_DURATION}ms ease` : "none",
                }}
            >
                {left}
            </Box>

            <Box
                width={3}
                bgcolor={dragging ? Colors.LIGHT_GRAY : Colors.MID_GRAY}
                sx={{ cursor: "col-resize" }}
                onMouseDown={startDrag}
            />

            <Box width={`${(1 - displayWidth) * 100 - 0.5}%`} height="100%" bgcolor={Colors.DARK_GRAY_OPACITY_20}>
                {right}
            </Box>
        </Box>
    );
};
