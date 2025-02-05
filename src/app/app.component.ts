import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { EmployeeService } from './services/employee.service';
import { Employee } from './models/employee.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<Employee>();
  originalData: Employee[] = [];
  lastSortedColumn: string | null = null;
  lastSortDirection: string = '';
  private isResetting = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  nonSortableColumns = new Set([
    'imageUrl', 'isDeleting', 'position', 'department', 
    'adress', 'address', 'firstName', 'email', 'name', 'lastName', 'contactNumber'
  ]);

  numericFirstColumns = new Set(['age', 'dob', 'salary']);

  constructor(private employeeService: EmployeeService) {}

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.sort.sortChange.subscribe(() => {
      if (this.isResetting) {
        this.isResetting = false;
        return;
      }

      if (this.sort.active === this.lastSortedColumn) {
        if (this.lastSortDirection === 'asc' || this.lastSortDirection === '') {
          this.resetToOriginalState();
        } else {
          this.setSortDirection('asc');
        }
      } else {
        this.setSortDirection('asc');
      }

      this.updateLastSortState();
    });

    this.loadEmployees();
  }

  private resetToOriginalState(): void {
    this.isResetting = true;
    this.dataSource.data = [...this.originalData];
    this.sort.direction = '';
    this.sort.active = '';
    this.dataSource.sort = this.sort;
    this.lastSortedColumn = null;
    this.lastSortDirection = '';
  }

  private setSortDirection(direction: 'asc' | 'desc'): void {
    this.sort.direction = direction;
    this.dataSource.sort = this.sort;
  }

  private updateLastSortState(): void {
    this.lastSortedColumn = this.sort.active;
    this.lastSortDirection = this.sort.direction;
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (data) => {
        this.displayedColumns = ['numero', ...this.getUniqueColumns(data)];
        this.originalData = [...data];
        this.dataSource.data = data;
        this.dataSource.sortingDataAccessor = this.sortingDataAccessor.bind(this);
      },
      error: (err) => console.error('Erreur lors du chargement des données:', err)
    });
  }

  getUniqueColumns(data: any[]): string[] {
    const columns = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => columns.add(key));
    });
    return Array.from(columns);
  }

  onPageChange(event: PageEvent): void {
    this.dataSource.paginator = this.paginator;
  }

  sortingDataAccessor(item: any, property: string): any {
    const value = item[property];
    const isNonRenseigne = value === 'Non renseigné' || value === null || value === undefined || value === '';
    
    if (isNonRenseigne) {
      return Number.POSITIVE_INFINITY;
    }
  
    if (this.nonSortableColumns.has(property)) {
      return null;
    }
  
    if (this.numericFirstColumns.has(property)) {
      if (!isNaN(Number(value))) {
        return Number(value);
      } else {
        return Number.MAX_VALUE;
      }
    }
    
    return value;
  }

  isSortable(column: string): boolean {
    return !this.nonSortableColumns.has(column);
  }
}