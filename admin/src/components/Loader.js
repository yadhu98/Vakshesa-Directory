import { jsx as _jsx } from "react/jsx-runtime";
export const Loader = ({ size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-6 h-6 border-2',
        lg: 'w-10 h-10 border-3',
    };
    return (_jsx("div", { className: `inline-block ${sizeClasses[size]} border-black border-t-transparent rounded-full animate-spin ${className}`, role: "status", "aria-label": "Loading" }));
};
export const PageLoader = () => {
    return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx(Loader, { size: "lg" }) }));
};
export const ButtonLoader = () => {
    return _jsx(Loader, { size: "sm", className: "border-white border-t-transparent" });
};
